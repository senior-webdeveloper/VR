import PropTypes from "prop-types";
import * as Yup from "yup";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
// form
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
// @mui
import { LoadingButton } from "@mui/lab";
import { styled } from "@mui/material/styles";
import {
  Grid,
  Card,
  Chip,
  Stack,
  Button,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";

// filepond
import axios from "axios";
import { FilePond } from "react-filepond";
import "filepond/dist/filepond.min.css";
// multiselect
import Multiselect from "multiselect-react-dropdown";

// firebase
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { FIREBASE_API } from "../../../../config";

// routes
import { PATH_DASHBOARD } from "../../../../routes/paths";
// components
import {
  FormProvider,
  RHFTextField,
  RHFUploadSingleFile,
} from "../../../../components/hook-form";
//

import useAuth from "../../../../hooks/useAuth";
import { createFile, updateFile } from "../../../../contexts/FirebaseContext";
import "./style.css";

// ----------------------------------------------------------------------

const TAGS_OPTION = [
  "Toy Story 3",
  "Logan",
  "Full Metal Jacket",
  "Dangal",
  "The Sting",
  "2001: A Space Odyssey",
  "Singin' in the Rain",
  "Toy Story",
  "Bicycle Thieves",
  "The Kid",
  "Inglourious Basterds",
  "Snatch",
  "3 Idiots",
];

const LabelStyle = styled(Typography)(({ theme }) => ({
  ...theme.typography.subtitle2,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
}));

// ----------------------------------------------------------------------

FileNewPostForm.propTypes = {
  isEdit: PropTypes.bool,
  currentData: PropTypes.object,
};

export default function FileNewPostForm({ isEdit, currentData }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firebaseApp = initializeApp(FIREBASE_API);
  const DB = getFirestore(firebaseApp);
  // console.log(user);
  const filename_ = currentData?.name || "";
  const [open, setOpen] = useState(false);
  const [fileCollection, setFileCollection] = useState([]);
  const [filename, setFilename] = useState(filename_);
  const [options, setOptions] = useState([]);
  const [selectedValue, setSelectedValue] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);

  const { enqueueSnackbar } = useSnackbar();

  const handleOpenPreview = () => {
    setOpen(true);
  };

  const handleClosePreview = () => {
    setOpen(false);
  };

  const NewFileSchema = Yup.object().shape({
    title: Yup.string().required("Title is required"),
    cover: Yup.mixed().required("Cover is required"),
  });

  const defaultValues = useMemo(
    () => ({
      title: currentData?.name || "",
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentData]
  );

  const methods = useForm({
    resolver: yupResolver(NewFileSchema),
    defaultValues,
  });

  const {
    formState: { isSubmitting, isValid },
  } = methods;

  const onSubmit = async (event) => {
    try {
      // await new Promise((resolve) => setTimeout(resolve, 500));
      // reset();
      // handleClosePreview();
      // enqueueSnackbar('Post success!');
      // navigate(PATH_DASHBOARD.blog.posts);
      if (!isEdit) {
        // console.log(event);
        event.preventDefault();
        const formData = new FormData();
        // console.log(fileCollection);
        await formData.append("userId", user.id);
        await formData.append(
          "fileUpload",
          fileCollection[0][0],
          `${filename}.glb`
        );

        // console.log(formData);
        // formData.append('fileName', filename);
        await axios
          .post("http://localhost:8000/uploadHandler", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          .then(async (resp) => {
            // console.log(resp.data);
            // Save to firestore
            const selectedUserIds = [];
            for (let i = 0; i < selectedUser.length; i += 1) {
              selectedUserIds.push(selectedUser[i].id);
            }
            await Promise.resolve(
              createFile(user.id, `${filename}.glb`, selectedUserIds)
            );
            navigate(PATH_DASHBOARD.file.list);
          });
      } else {
        // console.log(event);
        event.preventDefault();
        const formData = new FormData();
        // console.log(fileCollection);
        await formData.append("userId", user.id);
        await formData.append(
          "fileUpload",
          fileCollection[0][0],
          `${filename}.glb`
        );

        // formData.append('fileName', filename);
        await axios
          .post("http://localhost:8000/uploadHandler", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          .then(async (resp) => {
            // console.log(resp.data);
            // Save to firestore
            const selectedUserIds = [];
            for (let i = 0; i < selectedUser.length; i += 1) {
              selectedUserIds.push(selectedUser[i].id);
            }
            await Promise.resolve(
              updateFile(
                user.id,
                `${filename}.glb`,
                selectedUserIds,
                currentData.id
              )
            );
            navigate(PATH_DASHBOARD.file.list);
          });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onFileChange = (files) => {
    const item = files.map((fileitem) => fileitem.file);
    setFileCollection([...fileCollection, item]);
  };

  useEffect(async () => {
    const querySnapshot = await getDocs(collection(DB, "users"));
    const tempArray = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.role === "Client" && data.parentUserId === user.id) {
        const newData = { name: data.displayName, id: doc.id };
        tempArray.push(newData);
      }
    });
    setOptions(tempArray);
    let tempSelected = [];
    if (isEdit) {
      // console.log(currentData.name);
      // console.log(currentData.allowedUsers);
      setFilename(currentData.name);
      const querySnapshot1 = await getDocs(collection(DB, "files"));
      querySnapshot1.forEach((doc) => {
        const data = doc.data();
        if (doc.id === currentData.id) {
          tempSelected = currentData.allowedUsers;
        }
      });
      setSelectedValue(["0iLZ0o3fC1dB2xE7cvx60885yFK2"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentData]);

  const onSelect = (selectedList, selectedItem) => {
    setSelectedUser(selectedList);
  };
  const onRemove = (selectedList, removedItem) => {
    setSelectedUser(selectedList);
  };
  return (
    <>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Stack spacing={3}>
                <RHFTextField
                  name="title"
                  label="File Name"
                  onChange={(event) => setFilename(event.target.value)}
                  value={filename}
                />
                <div>
                  <LabelStyle>Cover</LabelStyle>

                  <FilePond
                    files={fileCollection}
                    server={null}
                    instantUpload={false}
                    allowMultiple={false}
                    onupdatefiles={(fileitem) => onFileChange(fileitem)}
                  />
                </div>
                <h4>Allow users to see the model.</h4>
                <Multiselect
                  options={options} // Options to display in the dropdown
                  selectedValues={selectedValue} // Preselected value to persist in dropdown
                  onSelect={onSelect} // Function will trigger on select event
                  onRemove={onRemove} // Function will trigger on remove event
                  displayValue="name" // Property name to display in the dropdown options
                />
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <LoadingButton
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                loading={isSubmitting}
              >
                Upload
              </LoadingButton>
            </Stack>
          </Grid>
        </Grid>
      </FormProvider>
    </>
  );
}
