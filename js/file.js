$(document).ready(function () {
  getFileData();
});

// validate

function validateFile(params) {
  if ($("#fileName").val() == "") {
    varifyNotification("Name is required");
    return false;
  }
  if ($("#mdfile").val() == "") {
    varifyNotification("File is required");
    return false;
  }
  if ($("#multiple-select").val() == "") {
    varifyNotification("User is required");
    return false;
  }
  return true;
}

// fileformat

function fileFormat(params) {
  $("#fileName").val("");
  $("#editFileId").val("");
  removeUpload();
}

//------------------------------ get data from firebase -------------------------------------//

function getFileData(params) {
  $("#fileTable tbody tr").remove();
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User

      let uid = user.uid;
      let users = await db
        .collection("users")
        .where("parentUserId", "==", uid)
        .get();
      let files = await db.collection("files").where("userId", "==", uid).get();
      const tempArray = [];

      files.forEach((doc) => {
        const data = doc.data();
        const allowedUsers = data.allowedUsers;
        const userList = [];

        users.forEach((doc_) => {
          if (allowedUsers.indexOf(doc_.id) !== -1) {
            userList.push(doc_.data().displayName);
          }
        });
        const userListStr = userList.join(", ");
        const newData = {
          name: data.fileName,
          id: doc.id,
          userId: data.userId,
          allowedUsers: userListStr,
        };
        tempArray.push(newData);
      });

      tempArray.map((data) => {
        let row = `<tr>
                        <td>
                        <span class="custom-checkbox">
                            <input type="checkbox" id="${data.name}" name="options[]" value="${data.id}" />
                            <label for="checkbox1"></label>
                        </span>
                        </td>
                        <td>${data.name}</td>
                        <td>${data.allowedUsers}</td>
                        <td>
                        <a href="" id="${data.id}" class="edit editFile" data-toggle="modal">
                            <i class="material-icons" data-toggle="tooltip" title="Edit">
                            &#xE254;
                            </i>
                        </a>
                        <a href="" id="${uid}/${data.name}" class="clientView" data-toggle="modal">
                            <i class="material-icons" data-toggle="tooltip" title="View">
                            &#xE254;
                            </i>
                        </a>
                        </td>
                    </tr>`;
        $("#fileTable tbody").append(row);
      });
      // Activate tooltip
      $('[data-toggle="tooltip"]').tooltip();

      // Select/Deselect checkboxes
      var checkboxFile = $('#fileDataTbl tbody input[type="checkbox"]');
      $("#selectAllFile").click(function () {
        if (this.checked) {
          checkboxFile.each(function () {
            this.checked = true;
          });
        } else {
          checkboxFile.each(function () {
            this.checked = false;
          });
        }
      });
      checkboxFile.click(function () {
        if (!this.checked) {
          $("#selectAllFile").prop("checked", false);
        }
      });
      // ...
      // Get the JWT (see line below)
    } else {
      // User is signed out
      // ...
    }
  });
}

// ------------------------------- save new file ------------------------------------//

$(document).on("click", "#newFile", function () {
  fileFormat();
  $("#addFileModal").modal("show");
});

$(document).on("click", "#addFile", function () {
  if (validateFile()) {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        let uid = user.uid;
        const fileId = $("#editFileId").val();
        const fileName =
          fileId == "" ? $("#fileName").val() + ".glb" : $("#fileName").val();
        const selectedUsers = $("#multiple-select").val();
        const fileData = document.getElementById("mdfile").files[0];

        const formData = new FormData();

        await formData.append("userId", uid);
        await formData.append("fileUpload", fileData, fileName);

        await axios
          .post("http://localhost:8000/uploadHandler", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          .then(async (resp) => {
            const userRef =
              fileId == ""
                ? db.collection("files").doc()
                : db.collection("files").doc(fileId);
            await userRef.set(
              {
                userId: uid,
                fileName: fileName,
                allowedUsers: selectedUsers,
                createdAt: new Date(),
              },
              { merge: true }
            );
            getFileData();
            fileFormat();
            varifyNotification("Success");
            $("#addFileModal").modal("hide");
          });
      }
    });
  }
});

//------------------------------- - delete file ----------------------------------//

$(document).on("click", "#deleteFile", function () {
  var flag = false;
  var checkboxFile = $('#fileDataTbl tbody input[type="checkbox"]');
  checkboxFile.each(function () {
    if (this.checked == true) {
      flag = true;
      return false;
    }
  });

  if (flag == true) {
    $("#deleteFileModal").modal("show");
  } else {
    varifyNotification(` Please select File`);
  }
});

$(document).on("click", "#deleteCancelFile", function () {
  var checkboxFile = $('#fileDataTbl tbody input[type="checkbox"]');
  checkboxFile.each(function () {
    this.checked = false;
  });
});

$(document).on("click", "#deleteConfirmFile", function () {
  var adminIds = [];
  var fileNames = [];
  var checkboxFile = $('#fileDataTbl tbody input[type="checkbox"]');
  checkboxFile.each(function () {
    if (this.checked == true) {
      adminIds.push(this.value);
      fileNames.push(this.id);
    }
  });

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      let uid = user.uid;

      await axios
        .post("http://localhost:8000/deleteHandler", {
          folder: uid,
          files: fileNames,
        })
        .then(async (resp) => {
          console.log(resp);
          batch = db.batch();
          adminIds.forEach((admin) => {
            batch.delete(db.collection("files").doc(admin));
          });
          batch
            .commit()
            .then((res) => {
              varifyNotification(`success: ${res}`);

              $("#deleteFileModal").modal("hide");
              getFileData();
            })
            .catch((err) => {
              varifyNotification(`Error: ${err}`);
            });
        });
    }
  });
});

//--------------------------------------- edit File -----------------------------//

$(document).on("click", ".editFile", function () {
  let editId = this.id;

  db.collection("files")
    .where(firebase.firestore.FieldPath.documentId(), "==", editId)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        let data = doc.data();

        fileFormat();
        $("#fileName").val(data.fileName);
        $("#editFileId").val(editId);
        // $("#editmultiple-select").val(data.allowedUsers);

        $("#addFileModal").modal("show");
      });
    });
});
