var btnLogin = document.getElementById("btnlogin");
var inputEmail = document.getElementById("inputemail");
var inputPassword = document.getElementById("inputpassword");

const ADMIN_EMAILS = "vrsuper@grabmail.club";

btnLogin.addEventListener("click", function () {
  if (inputEmail.value == ADMIN_EMAILS) {
    window.location = "./superAdmin.html";
  } else {
    firebase
      .auth()
      .signInWithEmailAndPassword(inputEmail.value, inputPassword.value)
      .then(function (result) {
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            const currentUserId = user.uid;
            db.collection("users")
              .where("uid", "==", user.uid)
              .get()
              .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  let data = doc.data();
                  if (data.role == "Admin") {
                    window.location = "./admin.html";
                  } else {
                    window.location = "./client.html";
                  }
                });
              });
          }
        });
      })
      .catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        alert(errorMessage);
        //console.log('falha')
      });
  }
});
