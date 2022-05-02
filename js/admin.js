$(document).ready(function () {
  openPage("clientTable");
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

//------------------------------ tab -------------------------------------//

function openPage(pageName) {
  // Hide all elements with class="tabcontent" by default */
  var i, tabcontent;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Show the specific tab content
  document.getElementById(pageName).style.display = "block";
}

$(document).on("click", ".nav-link", function () {
  if (this.id == "clientTab") {
    openPage("clientTable");
  }
  if (this.id == "fileTab") {
    openPage("fileTable");
  }
});

//------------------------------ get data from firebase -------------------------------------//

function getData(params) {
  $("#administrators tbody tr").remove();
  $("#multiple-select option").remove();

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      var uid = user.uid;
      db.collection("users")
        .where("role", "==", "Client")
        .where("parentUserId", "==", uid)
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
                                  <a href="" id="${data.uid}" class="edit editAdmin" data-toggle="modal">
                                    <i class="material-icons" data-toggle="tooltip" title="Edit">
                                      &#xE254;
                                    </i>
                                  </a>
                                </td>
                          </tr>`;
            let option = `<option value="${data.uid}">${data.displayName}</option>`;
            $("#multiple-select").append(option);
            $("#administrators tbody").append(row);
          });
          // Activate tooltip
          $('[data-toggle="tooltip"]').tooltip();

          // Select/Deselect checkboxes
          var checkbox = $('#administrators tbody input[type="checkbox"]');
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
      // ...
      // Get the JWT (see line below)
    } else {
      // User is signed out
      // ...
    }
  });
}

// ------------------------------- save new admin ------------------------------------//

$(document).on("click", "#newAdmin", async function () {
  if (validate()) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties W2iNheWpM8MegOrF7bfb2ynvPhG3
        // https://firebase.google.com/docs/reference/js/firebase.User
        var uid = user.uid;

        const name = $("#name").val();
        const email = $("#email").val();
        const phone = $("#phone").val();
        const status = $("#status").val();
        const password = $("#password").val();
        const parentUserId = uid;

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
                role: "Client",
                status: status,
                uid: res.user?.uid,
              },
              { merge: true }
            );
            format();
            varifyNotification("Success");
            $("#addEmployeeModal").modal("hide");
            logout();
            // ...
          })
          .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            varifyNotification(errorMessage);
            // ..
          });
      } else {
        // User is signed out
        // ...
      }
    });
  }
});

//------------------------------- - delete admin ----------------------------------//

$(document).on("click", "#deleteAdmin", function () {
  var flag = false;
  var checkbox = $('#administrators tbody input[type="checkbox"]');
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
  var checkbox = $('#administrators tbody input[type="checkbox"]');
  checkbox.each(function () {
    this.checked = false;
  });
});

$(document).on("click", "#deleteConfirm", async function () {
  var adminIds = [];
  var checkbox = $('#administrators tbody input[type="checkbox"]');
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

$(document).on("click", ".editAdmin", function () {
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
