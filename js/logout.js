var btnLogout = document.getElementById("btnlogout");

function logout(params) {
  firebase
    .auth()
    .signOut()
    .then(() => {
      //alert('Usuário Desonectado!');
      window.location = "index.html";
    })
    .catch(function (error) {
      var errorCode = error.code;
      var errorMessage = error.message;
      alert(errorMessage);
      //console.log('falha')
    });
}
btnLogout.addEventListener("click", function () {
  logout();
});
