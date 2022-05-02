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

$(document).ready(function () {
  $(".clientModal li").remove();

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      const uid = user.uid;
      await db
        .collection("files")
        .where("allowedUsers", "array-contains", uid)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            let data = doc.data();

            let row = `<li>
                        <a class="nav-link ar-object" id="${data.userId}/${data.fileName}" href="#">${data.fileName}</a>
                       </li>`;
            $(".clientModal").append(row);
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
});
