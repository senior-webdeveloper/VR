$(document).ready(function () {
  getData();
});

// alert

function varifyNotification(value) {
  color = "#721c24";

  $.notify(
    {
      icon: "nc-icon nc-app",
      message: "<b>  " + value + "  </b> ",
    },
    {
      type: type[color],
      timer: 8000,
      placement: {
        from: "top",
        align: "right",
      },
    }
  );
}

// format

function format(params) {
  $("#name").val() == "";
  $("#email").val() == "";
  $("#phone").val() == "";

  $("#editname").val() == "";
  $("#editemail").val() == "";
  $("#editphone").val() == "";
  $("#editId").val("");
}

// validate

function validate(params) {
  if ($("#name").val() == "") {
    varifyNotification("Name is required");
    return false;
  }
  if ($("#email").val() == "") {
    varifyNotification("Email is required");
    return false;
  }
  if ($("#phone").val() == "") {
    varifyNotification("Phone number is required");
    return false;
  }
  return true;
}

function editValidate(params) {
  if ($("#editname").val() == "") {
    varifyNotification("Name is required");
    return false;
  }
  if ($("#editemail").val() == "") {
    varifyNotification("Email is required");
    return false;
  }
  if ($("#editphone").val() == "") {
    varifyNotification("Phone number is required");
    return false;
  }
  return true;
}

//------------------------------ get data from firebase -------------------------------------//

function getData(params) {
  $("#administrators tbody tr").remove();

  db.collection("users")
    .where("role", "==", "Admin")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        let data = doc.data();
        let row = `<tr>
                            <td>
                              <span class="custom-checkbox">
                                <input type="checkbox" id="checkbox1" name="options[]" value="${data.uid}" />
                                <label for="checkbox1"></label>
                              </span>
                            </td>
                            <td>${data.displayName}</td>
                            <td>${data.email}</td>
                            <td>${data.phoneNumber}</td>
                            <td>
                              <p class="status${data.status}">${data.status}</p>
                            </td>
                            <td>
                              <a href="" id="${data.uid}" class="edit" data-toggle="modal">
                                <i class="material-icons" data-toggle="tooltip" title="Edit">
                                  &#xE254;
                                </i>
                              </a>
                            </td>
                      </tr>`;
        $("#administrators tbody").append(row);
      });
      // Activate tooltip
      $('[data-toggle="tooltip"]').tooltip();

      // Select/Deselect checkboxes
      var checkbox = $('table tbody input[type="checkbox"]');
      $("#selectAll").click(function () {
        if (this.checked) {
          checkbox.each(function () {
            this.checked = true;
          });
        } else {
          checkbox.each(function () {
            this.checked = false;
          });
        }
      });
      checkbox.click(function () {
        if (!this.checked) {
          $("#selectAll").prop("checked", false);
        }
      });
    })
    .catch((err) => {
      varifyNotification(`Error: ${err}`);
    });
}

// ------------------------------- save new admin ------------------------------------//

$(document).on("click", "#newAdmin", async function () {
  if (validate()) {
    const name = $("#name").val();
    const email = $("#email").val();
    const phone = $("#phone").val();
    const status = $("#status").val();
    const password = $("#password").val();
    const parentUserId = "YPciTjqFVMT38KROJPOp1u35TRC2";

    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(async (res) => {
        const userRef = db.collection("users").doc(res.user?.uid);
        await userRef.set(
          {
            displayName: name,
            email: email,
            parentUserId: parentUserId,
            phoneNumber: phone,
            role: "Admin",
            status: status,
            uid: res.user?.uid,
          },
          { merge: true }
        );
        format();
        varifyNotification("Success");
        $("#addEmployeeModal").modal("hide");
        getData();
        // ...
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        varifyNotification(errorMessage);
        // ..
      });
  }
});

//------------------------------- - delete admin ----------------------------------//

$(document).on("click", "#deleteAdmin", function () {
  var flag = false;
  var checkbox = $('table tbody input[type="checkbox"]');
  checkbox.each(function () {
    if (this.checked == true) {
      flag = true;
      return false;
    }
  });

  if (flag == true) {
    $("#deleteEmployeeModal").modal("show");
  } else {
    varifyNotification(` Please select admin`);
  }
});

$(document).on("click", "#deleteCancel", function () {
  var checkbox = $('table tbody input[type="checkbox"]');
  checkbox.each(function () {
    this.checked = false;
  });
});

$(document).on("click", "#deleteConfirm", async function () {
  var adminIds = [];
  var checkbox = $('table tbody input[type="checkbox"]');
  checkbox.each(function () {
    if (this.checked == true) {
      adminIds.push(this.value);
    }
  });

  batch = db.batch();
  adminIds.forEach((admin) => {
    batch.delete(db.collection("users").doc(admin));
  });
  batch
    .commit()
    .then((res) => {
      varifyNotification(`success: ${res}`);

      $("#deleteEmployeeModal").modal("hide");
      getData();
    })
    .catch((err) => {
      varifyNotification(`Error: ${err}`);
    });
});

//--------------------------------------- edit admin -----------------------------//

$(document).on("click", ".edit", function () {
  let editId = this.id;
  db.collection("users")
    .where("uid", "==", editId)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        let data = doc.data();

        format();

        $("#editname").val(data.displayName);
        $("#editemail").val(data.email);
        $("#editphone").val(data.phoneNumber);
        $("#editstatus").val(data.status);
        $("#editId").val(editId);

        $("#editEmployeeModal").modal("show");
      });
    });
});

$(document).on("click", "#editSave", async function () {
  if (editValidate()) {
    const name = $("#editname").val();
    const email = $("#editemail").val();
    const phone = $("#editphone").val();
    const status = $("#editstatus").val();
    const editId = $("#editId").val();

    const userRef = db.collection("users").doc(editId);
    await userRef.set(
      {
        displayName: name,
        email: email,
        phoneNumber: phone,
        status: status,
      },
      { merge: true }
    );
    format();
    varifyNotification("Success");
    $("#editEmployeeModal").modal("hide");
    getData();
  }
});
