//import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
import { Octokit } from "https://esm.sh/@octokit/core";

let octokit;
// lp => janaushadhi,janaushadhimrj;

const loggedIn = localStorage.getItem("gt") ? true : false;
const fav = localStorage.getItem("fav");

console.log("loggedIn => " + loggedIn);

const medlistList = document.getElementById("medlistList");
const medlistSearchBox = document.getElementById("medlistSearchBox");
const medlistSearchBoxClear = document.getElementById("medlistSearchBoxClear");

let jsonMeds = [], jsonMedsAvl = [], jsonMedsFav = [], updationQueue = [], favQueue = [];

async function fetchData() {

  if (loggedIn) {

    octokit = new Octokit({ auth: localStorage.getItem("gt") });

    const [medsDataResponse, { data: { content } }, medsFavResponse] = await Promise.all([

      fetch("/assets/json/meds-data-min.json"),

      octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'amitexm',
        repo: 'medsy',
        path: 'assets/json/meds-avl-min.json',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }),

      octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'amitexm',
        repo: 'medsy',
        path: 'assets/json/meds-fav-min.json',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    ]);

    var jsonMedsData = await medsDataResponse.json();

    jsonMedsAvl = JSON.parse(CryptoJS.enc.Base64.parse(content.replace(/\n/g, "")).toString(CryptoJS.enc.Utf8));

    jsonMedsFav = JSON.parse(CryptoJS.enc.Base64.parse(medsFavResponse.data.content.replace(/\n/g, "")).toString(CryptoJS.enc.Utf8));

  } else {

    const [medsDataResponse, medsAvlResponse] = await Promise.all([
      fetch("/assets/json/meds-data-min.json"),
      fetch("/assets/json/meds-avl-min.json?qs=" + Date.now())
    ]);

    var jsonMedsData = await medsDataResponse.json();

    jsonMedsAvl = await medsAvlResponse.json();

    jsonMedsFav = fav ? JSON.parse(fav) : [];

  }

  for (let i = 0; i < jsonMedsData.length; i++) {
    jsonMeds.push({
      ...jsonMedsData[i],
      ...jsonMedsAvl.find((item) => item === jsonMedsData[i].dc) ? { avl: 1 } : { avl: 0 },
      ...jsonMedsFav.find((item) => item === jsonMedsData[i].dc) ? { fav: 1 } : { fav: 0 }
    });
  }
  console.log(jsonMeds);
  return jsonMeds;
}

let li, liCount, divideInto, chunkSize, rem, iterations;

function listMeds(data, toAppend) {

  // standalone function for displaying list from 'data' js object.

  const arrLength = data.length;

  divideInto = 12;

  chunkSize = Math.trunc(arrLength / divideInto);

  rem = arrLength % divideInto;

  iterations = !rem ? divideInto : divideInto + 1;

  let iteration = 0;

  toAppend.innerHTML = "";

  setTimeout(function generateRows() {
    const base = chunkSize * iteration;
    const loopSize = iteration != divideInto ? base + chunkSize : base + rem;
    let text = "";

    for (let i = base; i < loopSize; i++) {
      text = text +
        `<li data-dc="${data[i].dc}" class="list-group-item ${data[i].avl ? "list-group-item-success" : "list-group-item-danger"}">
            <div>${data[i].gn}</div>
            <div class="detail text-muted">
              <small>(${data[i].dc})</small>
              <small>${data[i].us}</small>
              <small>${data[i].mrp ? "Rs. " + data[i].mrp : "Under Processing"}</small>
              <label class="fav"><input type="checkbox" name="fav" data-dc="${data[i].dc}" ${data[i].fav ? "checked" : ""}></label>
              ${loggedIn ? `<input type="checkbox" name="avl" data-dc="${data[i].dc}" ${data[i].avl ? "checked" : ""}>` : ""}
            </div>
        </li>`;
    }

    toAppend.insertAdjacentHTML("beforeend", text);

    iteration++;

    if (iteration < iterations) { setTimeout(generateRows, 0); }

    else {
      const scrollPos = sessionStorage.getItem("scrollPos");
      if (scrollPos !== null) {
        document.documentElement.scrollTop = parseInt(scrollPos, 10);
      }

      if (medlistSearchBox.value.trim() !== "") {
        medlistSearchBox.dispatchEvent(new Event("input", { bubbles: true }));
      }
      // initializing values for filtermeds only after medlist is generated
      // One time initialization for filtermeds() to prevent reinitialization on every search box value entered
      li = medlistList.getElementsByTagName("li");
      liCount = li.length; divideInto = 12;
      chunkSize = Math.trunc(liCount / divideInto); rem = liCount % divideInto;
      iterations = !rem ? divideInto : divideInto + 1;
    }
  }, 0);

}

function filterMeds(value) {

  let filter = value.toLowerCase().trim();

  let iteration = 0;

  setTimeout(function showHideRows() {

    const base = chunkSize * iteration;
    const loopSize = iteration === divideInto ? base + rem : base + chunkSize;

    // Loop through all list items, and hide those not matching the search query

    let gnElm, i, txtValue;

    for (i = base; i < loopSize; i++) {

      gnElm = li[i].firstElementChild;

      txtValue = gnElm.textContent || gnElm.innerText;

      if (txtValue.toLowerCase().trim().indexOf(filter) > -1) {
        if (li[i].style.display === "none") li[i].style.display = "block";
      }
      else if (li[i].style.display != "none") {
        li[i].style.display = "none";
      }


      // if (txtValue.toLowerCase().trim().indexOf(filter) > -1) {
      //   if (li[i].hasAttribute("style")) li[i].removeAttribute("style");
      // } else if (!li[i].hasAttribute("style")) {
      //   li[i].setAttribute("style", "display:none!important");
      // }
    }

    iteration++;

    if (iteration < iterations) setTimeout(showHideRows, 0);
  }, 0);
}

(async () => {
  const searchValue = sessionStorage.getItem("searchValue");
  if (searchValue !== null) {
    medlistSearchBox.value = searchValue;
    medlistSearchBoxClear.style.display = "block";
  }
})();



fetchData().then((data) => {

  listMeds(data, medlistList);

  let timer;

  medlistSearchBox.addEventListener("input", (input) => {

    let value = input.target.value;

    medlistSearchBoxClear.style.display = value.length != 0 ? "block" : "none";

    clearTimeout(timer);

    if (input.closeBtn) {
      filterMeds(value);
    }
    else {
      timer = setTimeout(() => {
        filterMeds(value);
      }, 200);
    }


    if (value.length != 0) { window.location.hash = "search"; }

    document.documentElement.scrollTop = 0;

  });

  // medlist search box clear button

  medlistSearchBoxClear.addEventListener("click", () => {
    medlistSearchBox.value = "";
    const event = new Event("input", { bubbles: true });
    event.closeBtn = true;
    medlistSearchBox.dispatchEvent(event);

    if (window.location.hash != '') {
      history.back();
    }




  });

  // jsonMedsData = jsonMeds.map(item => {
  //   return {
  //           "dc": parseInt(item.dc),
  //           "gn": item.gn,
  //           "us": item.us,
  //           "mrp": parseInt(item.mrp)
  //          }
  //   });
  // console.log(JSON.stringify(jsonMedsData));
  // console.log(JSON.stringify(jsonMedsData.sort((a, b) => a.dc - b.dc)));

  // jsonMedsAvl = jsonMeds.map(item => {
  //   return {
  //     "dc": parseInt(item.dc),
  //     "avl": item.avl
  //          }
  //   });
  // console.log(JSON.stringify(jsonMedsAvl));
  // console.log(JSON.stringify(jsonMedsAvl.sort((a, b) => a.dc - b.dc)));

});


const loginBtn = document.getElementById("loginBtn");
const dialogLogin = document.getElementById('dialogLogin');
const btnCloseLoginDialog = document.getElementById('btnCloseLoginDialog');
const modalLogin = new bootstrap.Modal('#dialogLogin');

const favNavBtn = document.getElementById("favNavBtn");
const counterFavNavBtn = document.getElementById("counterFavNavBtn");
const favListDialogList = document.getElementById("favListDialogList");
const favListDialog = document.getElementById('favListDialog');
const modalFav = new bootstrap.Modal('#favListDialog');

const btnFavSync = document.getElementById("btnFavSync");
const btnFavSyncText = btnFavSync.querySelector('#btnFavSync-text');
const btnFavSyncStatus = btnFavSync.querySelector('#btnFavSync-status');
const btnCloseFavDialog = document.querySelector('#btnCloseFavDialog');

const modalUpdationQueue = new bootstrap.Modal('#dialogUpdationQueue');

if (!loggedIn) {

  const userLogin = async (event) => {

    event.target.elements.submitBtn.disabled = true;
    event.target.elements.submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" style="margin-right:5px; margin-bottom:2px;" role="status"
    aria-hidden="true"></span>Signing In . .`;

    const lCreds = {
      u: "38fa997fe1c80c07e7632fed99f877a7ee9fcf22bf1063ce92ea4d3a0dc59eef5aa8216cc396aa1d2c69a5aedf359c9a06e8b1ec750e335c2eb51aa0b779617a",
      p: "da9e943ed8a93a8acfd01f76ce793dbe84a281f29f4f2ba2cdffaee9848bde3a6142928e99796bfc35c4d873fab1a83289cf17defaffc66c97405482a34ebf6c"
    };

    const ue = event.target.elements.ueInput.value;
    const pass = event.target.elements.passInput.value;

    if (CryptoJS.SHA3(ue).toString() !== lCreds.u || CryptoJS.SHA3(pass).toString() !== lCreds.p) {
      setTimeout(() => {
        showAlert('Bad Credentials!', 'danger');
        event.target.elements.submitBtn.innerHTML = "Sign In";
        event.target.elements.submitBtn.disabled = false;
      }, 3000);
      return;

    } else {

      const cipher = "U2FsdGVkX19KAVxzKtTDRHF4/f4Zgu2njlgXSgQBpp7/No0XteV5H8OBAHhGZqn85Jc0vF9wamZSzykD6L2tYQ==";
      const gt = CryptoJS.AES.decrypt(cipher, pass).toString(CryptoJS.enc.Utf8);
      // console.log(gt);

      const octokit = new Octokit({ auth: gt });

      const { data: { id } } = await octokit.request("/user");

      console.log(id);

      setTimeout(() => {

        if (id == "60008947") {

          localStorage.setItem("gt", gt);
          event.target.elements.submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" style="margin-right:5px; margin-bottom:2px;" role="status"
          aria-hidden="true"></span>Redirecting . .`;
          // const noHashURL = window.location.href.replace(/#.*$/, '');
          // window.history.replaceState('', document.title, noHashURL)
          setTimeout(() => {
            history.back();
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }, 1500);


        } else {

          localStorage.removeItem("gt");
          setTimeout(() => {
            showAlert('Bad Credentials!', 'danger');
            event.target.elements.submitBtn.innerHTML = "Sign In";
            event.target.elements.submitBtn.disabled = false;
          }, 4000);
        }
      }, 2000);
    }
  };

  // Fetch the form we want to apply custom Bootstrap validation styles to
  const loginForm = document.querySelector(".needs-validation");
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault(); event.stopPropagation();

    alertPlaceholder.innerHTML = "";
    loginForm.classList.add('was-validated');

    if (!validate(event)) {

      event.target.elements.ueInput.addEventListener('input', () => {
        validateUE(event);
      });
      event.target.elements.passInput.addEventListener('input', () => {
        validatePass(event);
      });
    } else {

      setTimeout(userLogin(event), 2000);
    }
  });


  const validate = (event) => {

    const isValidUe = validateUE(event);

    const isValidPass = validatePass(event);

    return isValidUe && isValidPass;
  }

  const ueInvalid = document.querySelector("#ueInput + div.invalid-feedback");
  const validateUE = (event) => {
    const ueInput = event.target.elements.ueInput;
    if (ueInput.value.length == 0) {
      ueInput.setCustomValidity(' ');
      ueInvalid.innerHTML = "Login can't be empty.";
    } else if (ueInput.value.length < 6) {
      ueInput.setCustomValidity(' ');
      ueInvalid.innerHTML = "Username too short.";
    } else if (/\@/.test(ueInput.value)) {
      if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(ueInput.value)) {
        ueInput.setCustomValidity("");
        return true;
      } else {
        ueInput.setCustomValidity(' ');
        ueInvalid.innerHTML = "Invalid Email.";
      }
    } else {
      ueInput.setCustomValidity("");
      return true;
    }
  }

  const passInvalid = document.querySelector("#passInput + div.invalid-feedback");
  const validatePass = (event) => {
    const passInput = event.target.elements.passInput;
    if (passInput.value.length == 0) {
      passInput.setCustomValidity(' ');
      passInvalid.innerHTML = "Password can't be empty.";
    } else if (passInput.value.length < 8) {
      passInput.setCustomValidity(' ');
      passInvalid.innerHTML = "Password too small.";
    } else {
      passInput.setCustomValidity("");
      return true;
    }
  }

  dialogLogin.addEventListener('hidden.bs.modal', () => {
    loginForm.classList.remove("was-validated");
    loginForm.elements.submitBtn.disabled = false;
    loginForm.elements.submitBtn.innerHTML = "Sign In";
    loginForm.reset();
    alertPlaceholder.innerHTML = "";
  });

  const loaderBody = document.getElementById('loaderBody');
  const toggleNavBtn = document.getElementById('toggleNavBtn');
  const navbarContent = document.getElementById('navbarContent');
  loginBtn.addEventListener("click", () => {
    toggleNavBtn.classList.remove("is-active");
    navbarContent.classList.remove("show");
    // let modalLogin = new bootstrap.Modal('#dialogLogin', {});
    loaderBody.style.display = "block";
    setTimeout(() => {
      loaderBody.style.display = "none";
      modalLogin.show();
    }, 500);
  });

  const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
  const showAlert = (message, type) => {
    alertPlaceholder.innerHTML = [
      `<div class="alert alert-${type} alert-dismissible" role="alert" fade show>`,
      `   <div class="text-center">${message}</div>`,
      '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
      '</div>'
    ].join('');
  }

  const passToggle = document.querySelector('#passToggle');
  const passInput = document.querySelector('#passInput');
  passToggle.addEventListener('click', () => {
    if (passInput.type === "password") {
      passInput.type = "text";
      passToggle.innerHTML = `<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/> <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/> <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>`;
    } else {
      passInput.type = "password";
      passToggle.innerHTML = `<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z" /> <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />`;
    }
  });


  btnFavSync.addEventListener('click', async (e) => {
    if (favQueue.length) {
      localStorage.setItem("fav", JSON.stringify(jsonMedsFav));
      favQueue.length = 0;
      counterFavNavBtn.style.display = "none";
      btnFavSyncText.innerHTML = "Saving...";
      setTimeout(() => {
        btnFavSyncText.innerHTML = "Saved";
        btnFavSync.disabled = true;
      }, 1000);
    }

  });

}

else {

  const { data: { id } } = await octokit.request("/user");
  console.log(id);

  /** Logged UI */

  loginBtn.innerHTML = "Logout";
  loginBtn.addEventListener("click", () => {
    loaderBody.style.display = "block";
    localStorage.removeItem("gt");
    localStorage.setItem("fav", JSON.stringify(jsonMedsFav));
    setTimeout(() => {
      loaderBody.style.display = "none";
      window.location.reload();
    }, 1000);
  });

  document.querySelector('#bottomNav').classList.remove("d-none");


  /*** Logged In Operations */

  const btnUpdationQueue = document.getElementById("btnUpdationQueue");
  const counterBtnUpdationQueue = document.getElementById("counterBtnUpdationQueue");
  const medlistUpdateQueueDialog = document.getElementById("medlistUpdateQueueDialog");
  const dialogUpdationQueue = document.getElementById('dialogUpdationQueue');
  const btnUpdate = document.getElementById("btnUpdate");
  const counterBtnUpdate = document.getElementById("counterBtnUpdate");


  btnUpdationQueue.addEventListener("click", function () {

  });

  dialogUpdationQueue.addEventListener('show.bs.modal', () => {
    let text = "";
    for (let i = 0; i < updationQueue.length; i++) {
      text = text +
        `<li class="list-group-item ${updationQueue[i].avl ? "list-group-item-success" : "list-group-item-danger"}">
              <div class="h6">${updationQueue[i].gn}</div>
              <div class="detail text-muted">
                <small>(${updationQueue[i].dc})</small>
                <small>${updationQueue[i].us}</small>
                <small>${updationQueue[i].mrp ? "Rs. " + updationQueue[i].mrp : "Under Processing"}</small>
                <label class="fav"><input type="checkbox" name="fav" data-dc="${updationQueue[i].dc}" ${updationQueue[i].fav ? "checked" : ""}></label>
                <input type="checkbox" name="avl" data-dc="${updationQueue[i].dc}" ${!updationQueue[i].avl ? "checked" : ""}>
              </div>
        </li>`;
    }
    if (text) medlistUpdateQueueDialog.innerHTML = text;

    btnUpdate.disabled = updationQueue.length ? false : true;
  });

  medlistUpdateQueueDialog.addEventListener("click", function (e) {
    if ("checkbox" === e.target.type) {
      // reusing the function to remove the clicked meds object from updationQueue[] array.
      editUpdationQueue(e);

      // code to restore the med's previous state (check/unchecked) in medlist when med is removed from UpdateQueue dialog.
      // Select element inside main list
      let medlistList_medCbx = medlistList.querySelector(`[name="${e.target.name}"][data-dc="${e.target.dataset.dc}"]`);
      medlistList_medCbx.checked = !medlistList_medCbx.checked;

      // only remove med from updation queue on clicking checkboxs with name="avl". 
      if ("avl" === e.target.name) {
        // remove the med's parent container (li) element from updation queue dialog with a fade out effect.
        e.target.parentElement.parentElement.style.transition =
          "opacity 0.5s ease";
        e.target.parentElement.parentElement.style.opacity = 0;

        setTimeout(() => { e.target.parentElement.parentElement.remove() }, 500);
      }
    }

    // stope event propagation going any further then where event listener is added (medlistUpdateQueueDialog).
    e.stopPropagation(); //warning
  });

  const btnUpdateText = btnUpdate.querySelector('#updateBtn-text');
  const btnUpdateStatus = btnUpdate.querySelector('#btnUpdate-status');
  const btnCloseDialogUpdationQueue = document.querySelector('#btnCloseDialogUpdationQueue');
  btnUpdate.addEventListener('click', async (e) => {

    if (typeof (updateAlert) !== "undefined") {
      updateAlert.remove();
    }

    if (updationQueue.length === 0) {
      e.stopPropagation();
      medlistUpdateQueueDialog.innerHTML =
        `<div class="alert bg-body py-4 mb-0">
          <div class="alert alert-warning text-center mb-0" role="alert">Nothing to update.</div>
        </div>`;

    } else {

      btnUpdateStatus.style.display = "inline-block";
      btnUpdate.style.backgroundColor = "#dc3545";
      btnUpdate.disabled = true;
      btnUpdateText.innerHTML = "Updating...";

      // setTimeout(() => {
      //   btnCloseDialogUpdationQueue.addEventListener('click', function btnCloseHandler() {
      //     btnUpdate.disabled = false;
      //     btnUpdateText.innerHTML = "Update";
      //     btnUpdate.style.backgroundColor = "#5757E7";
      //     btnUpdateStatus.style.display = "none";
      //     this.removeEventListener('click', btnCloseHandler);
      //   });
      // }, 2000);


      const path = "assets/json/meds-avl-min.json";

      const sha = await getSHA(path);

      jsonMedsAvl.sort((a, b) => a - b);

      const base64 = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonMedsAvl)).toString(CryptoJS.enc.Base64);

      if (200 === await updateFile(sha, path, base64)) {

        medlistUpdateQueueDialog.innerHTML =
          `<div class="alert bg-body py-4 mb-0">
            <div class="alert alert-success text-center mb-0" role="alert">Update Success!</div>
          </div>`
        updationQueue.length = 0;
        counterBtnUpdationQueue.innerHTML = "";
        counterBtnUpdate.innerHTML = "";

        btnUpdate.style.backgroundColor = "#5757E7";
        btnUpdate.disabled = true;
        btnUpdateText.innerHTML = "Updated";
        btnCloseDialogUpdationQueue.innerHTML = "Close";
        btnUpdateStatus.style.display = "none";

      } else {

        medlistUpdateQueueDialog.parentElement.prepend(Object.assign(document.createElement('div'), {
          id: 'update-alert',
          className: 'alert position-sticky z-1 bg-body pt-5 pb-4 top-0 mb-0 fade show',
          innerHTML: `<div class="alert alert-danger alert-dismissible mb-0">
                        <div class="text-center">Update Error!</div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" data-bs-target="#update-alert"></button>
                      </div>`
        }));
        const updateAlert = medlistUpdateQueueDialog.querySelector('#update-alert');
      }

    }
  });


  btnFavSync.addEventListener('click', async (e) => {

    const updateAlert = favListDialogList.querySelector('#update-alert');
    if (updateAlert) {
      updateAlert.remove();
    }

    if (favQueue.length === 0) {
      e.stopPropagation();
      favListDialogList.prepend(Object.assign(document.createElement('div'), {
        id: 'update-alert',
        className: 'alert position-sticky z-1 bg-body pt-2 pb-3 top-0 mb-0 fade show',
        innerHTML: `<div class="alert alert-warning alert-dismissible mb-0">
                      <div class="text-center">Nothing to Save.</div>
                      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" data-bs-target="#update-alert"></button>
                    </div>`
      }));



    } else {

      btnFavSyncStatus.style.display = "inline-block";
      btnFavSync.style.backgroundColor = "#dc3545";
      btnFavSync.disabled = true;
      btnFavSyncText.innerHTML = "Saving...";

      // setTimeout(() => {
      //   btnCloseFavDialog.addEventListener('click', function btnCloseHandler() {
      //     btnFavSync.disabled = false;
      //     btnFavSyncText.innerHTML = "Save";
      //     btnFavSync.style.backgroundColor = "#5757E7";
      //     btnFavSyncStatus.style.display = "none";
      //     this.removeEventListener('click', btnCloseHandler);
      //   });
      // }, 2000);


      const path = "assets/json/meds-fav-min.json";

      const sha = await getSHA(path);

      jsonMedsFav.sort((a, b) => a - b);

      const base64 = CryptoJS.enc.Utf8.parse(JSON.stringify(jsonMedsFav)).toString(CryptoJS.enc.Base64);

      if (200 === await updateFile(sha, path, base64)) {

        favListDialogList.prepend(Object.assign(document.createElement('div'), {
          id: 'update-alert',
          className: 'alert position-sticky z-1 bg-body pt-2 pb-3 top-0 mb-0 fade show',
          innerHTML: `<div class="alert alert-success alert-dismissible mb-0">
                        <div class="text-center">Successfully Saved.</div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" data-bs-target="#update-alert"></button>
                      </div>`
        }));

        favQueue.length = 0;
        counterFavNavBtn.style.display = "none";
        // counterBtnUpdate.innerHTML = "";

        btnFavSync.style.backgroundColor = "#5757E7";
        btnFavSync.disabled = true;
        btnFavSyncText.innerHTML = "Saved";
        btnCloseFavDialog.innerHTML = "Close";
        btnFavSyncStatus.style.display = "none";

      } else {

        favListDialogList.prepend(Object.assign(document.createElement('div'), {
          id: 'update-alert',
          className: 'alert position-sticky z-1 bg-body pt-2 pb-3 top-0 mb-0 fade show',
          innerHTML: `<div class="alert alert-danger alert-dismissible mb-0">
                        <div class="text-center">Update Error!</div>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" data-bs-target="#update-alert"></button>
                      </div>`
        }));

      }

    }
  });


  const getSHA = async (path) => {
    const { data: { sha } } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "amitexm",
      repo: "medsy",
      path: path,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      }
    });
    return sha;
  };

  const updateFile = async (sha, path, base64) => {
    const { status } = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner: "amitexm",
        repo: "medsy",
        path: path,
        message: "change avl",
        committer: {
          name: "amitexm",
          email: "amitexm@github.com",
        },
        content: base64,
        sha: sha,
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    return status;
  };


}


medlistList.addEventListener("click", function (e) {
  if ("checkbox" === e.target.type) {
    editUpdationQueue(e);
  }
});

function editUpdationQueue(e) {

  // let dc = parseInt(e.target.parentElement.children[0].innerHTML.match(/\d+/));
  let dc = parseInt(e.target.dataset.dc);

  if ("avl" === e.target.name) {

    // Find medicine to change its Availability in jsonMeds(generated by combining jsonMedsData and jsonMedsAvl in fetchdata()).
    let dc_jsonMedsIndx = jsonMeds.findIndex((item) => item.dc === dc);
    // jsonMeds[dc_jsonMedsIndx].avl = Number(e.target.checked);

    // Find medicine and change its Availability in jsonMedsAvl. Both arrays are sorted so they should contain same medicine at same index.
    let dc_jsonMedsAvlIndx = jsonMedsAvl.findIndex((item) => item === dc);
    if (dc_jsonMedsAvlIndx > -1) {
      jsonMedsAvl.splice(dc_jsonMedsAvlIndx, 1);
    } else {
      jsonMedsAvl.push(dc);
    }

    let dc_updationQueueIndx = updationQueue.findIndex((item) => item.dc === dc);
    if (dc_updationQueueIndx > -1) {
      updationQueue.splice(dc_updationQueueIndx, 1);
    } else {
      let updationMed = {
        dc: dc,
        gn: jsonMeds[dc_jsonMedsIndx].gn,
        us: jsonMeds[dc_jsonMedsIndx].us,
        mrp: jsonMeds[dc_jsonMedsIndx].mrp,
        avl: jsonMeds[dc_jsonMedsIndx].avl,
        fav: jsonMeds[dc_jsonMedsIndx].fav
      };
      updationQueue.push(updationMed);
    }

    let counterUpdationQueue = updationQueue.length ? updationQueue.length : "";
    counterBtnUpdationQueue.innerHTML = counterUpdationQueue;
    counterBtnUpdate.innerHTML = counterUpdationQueue;

    btnUpdate.disabled = updationQueue.length ? false : true;
  }

  else if ("fav" === e.target.name) {

    // Change favorite in jsonMeds (generated by combining jsonMedsData and jsonMedsAvl in fetchdata()).
    let dc_jsonMedsIndx = jsonMeds.findIndex((item) => item.dc === dc);
    jsonMeds[dc_jsonMedsIndx].fav = Number(e.target.checked);

    // Change favourite in jsonMedsFav Array dc values.
    let dc_jsonMedsFavIndx = jsonMedsFav.findIndex((item) => item === dc);
    if (dc_jsonMedsFavIndx > -1) {
      jsonMedsFav.splice(dc_jsonMedsFavIndx, 1);
    } else {
      jsonMedsFav.push(dc);
    }

    // Change favorite in favQueue -- Array of fovorited medicin Objects.
    let dc_favQueueIndx = favQueue.findIndex((item) => item === dc);
    if (dc_favQueueIndx > -1) {
      favQueue.splice(dc_favQueueIndx, 1);
    } else {
      favQueue.push(dc);
    }
    counterFavNavBtn.style.display = favQueue.length ? "block" : "none";
    btnFavSyncText.innerHTML = "Save";
    btnFavSync.disabled = favQueue.length ? false : true;


    // Change favorite in updationQueue -- Array of medicin Objects to change Availability.
    let dc_updationQueueIndx = updationQueue.findIndex((item) => item.dc === dc);
    if (dc_updationQueueIndx > -1) {
      updationQueue[dc_updationQueueIndx].fav = Number(e.target.checked);
    }

  }

  e.stopPropagation(); //warning
}


favListDialog.addEventListener('show.bs.modal', () => {
  favNavBtn.classList.add("active");

  let text = "";
  for (let i = 0; i < jsonMeds.length; i++) {
    if (jsonMeds[i].fav) {
      text = text +
        `<li class="list-group-item ${jsonMeds[i].avl ? "list-group-item-success" : "list-group-item-danger"}">
            <div class="h6">${jsonMeds[i].gn}</div>
            <div class="detail text-muted">
              <small>(${jsonMeds[i].dc})</small>
              <small>${jsonMeds[i].us}</small>
              <small>${jsonMeds[i].mrp ? "Rs. " + jsonMeds[i].mrp : "Under Processing"}</small>
              <label class="fav"><input type="checkbox" name="fav" data-dc="${jsonMeds[i].dc}" ${jsonMeds[i].fav ? "checked" : ""}></label>
              ${loggedIn ? `<input type="checkbox" name="avl" data-dc="${jsonMeds[i].dc}" ${jsonMedsAvl.find(item => jsonMeds[i].dc === item) ? "checked" : ""}>` : ""}
            </div>   
        </li>`;
    }
  }
  favListDialogList.innerHTML = text;

  btnFavSync.disabled = favQueue.length ? false : true;
});

favListDialogList.addEventListener("click", function (e) {
  if ("checkbox" === e.target.type) {

    // reusing the function to remove the clicked meds object from updationQueue[] array.
    editUpdationQueue(e);

    // code to restore the med's previous state (check/unchecked) in medlist when med is removed from UpdateQueue dialog.
    // Select element inside main list
    let medlistList_medCbx = medlistList.querySelector(`[name="${e.target.name}"][data-dc="${e.target.dataset.dc}"]`);
    medlistList_medCbx.checked = !medlistList_medCbx.checked;
  }

  // stope event propagation going any further then where event listener is added (medlistUpdateQueueDialog).
  e.stopPropagation(); //warning
});


favListDialog.addEventListener('hide.bs.modal', () => {
  favNavBtn.classList.remove("active");
  // if (window.location.hash != '') {
  //   history.back();
  // }

  // let noHashURL = window.location.href.replace(/#.*$/, '');
  // window.history.replaceState('', document.title, noHashURL)
});

// [dialogLogin, dialogUpdationQueue].forEach((dialog) => {
//   dialog.addEventListener('hide.bs.modal', () => {
//     if (window.location.hash != '') {
//       history.back();
//     }
//   });
// });


favNavBtn.addEventListener('click', () => {

  if (!favNavBtn.classList.contains("active")) {
    history.back();
  }
});

[btnCloseFavDialog, btnCloseDialogUpdationQueue, btnCloseLoginDialog].forEach((btn) => {
  btn.addEventListener('click', () => {
    history.back();
  });
});

// btnCloseFavDialog.addEventListener('click', () => {
//   history.back();

// });

// btnCloseDialogUpdationQueue.addEventListener('click', () => {
//   history.back();

// });



const myModals = document.querySelectorAll('.modal');
myModals.forEach(modal => {
  if (modal.dataset.hash) {
    modal.addEventListener('show.bs.modal', () => {
      window.location.hash = modal.dataset.hash;
    });
  }
});




window.addEventListener('hashchange', (e) => {
  if (window.location.hash === "" || window.location.hash === "#updationQueue" || window.location.hash === "#login" || window.location.hash === "#search") {

    // go home directly if favorite modal was opened after updation queue modal on closing favorite modal
    if (window.location.hash === "#updationQueue" && e.oldURL.includes("#favorites")) {
      history.back();
    }

    // go home directly if favorite modal was opened after login modal on closing favorite modal
    if (window.location.hash === "#login" && e.oldURL.includes("#favorites")) {
      history.back();
    }

    // Go back to Home from an ongoing search 
    if (medlistSearchBox.value != '' && window.location.hash != '#search' && window.location.hash != '#login' && window.location.hash != '#updationQueue') {
      const event = new Event("click", { bubbles: true });
      event.closeBtn = true;
      medlistSearchBoxClear.dispatchEvent(event);
    }


    modalFav.hide();
    modalLogin.hide();
    modalUpdationQueue.hide();

    // 
  }
  // else if (window.location.hash === "#favorites") {
  //   modalFav.show();
  // } else if (window.location.hash === "#login") {
  //   modalLogin.show();
  // } else if (window.location.hash === "#updationQueue" && loggedIn) {
  //   modalUpdationQueue.show();
  // }
});










const bottomNav = document.getElementById("bottomNav");
const scrollBtnDown = document.getElementById("scrollBtn-down");
//  AUTO show/hide bottom nav onscroll.
bottomNav.style.transition = "all 0.3s ease-in-out";
let prevScrollpos = window.pageYOffset;
let timer;
window.addEventListener('scroll', () => {

  clearTimeout(timer);

  timer = setTimeout(() => {

    let currentScrollPos = window.pageYOffset;
    if (document.documentElement.scrollTop === 0) {
      scrollBtnDown.style.display = "block";
    } else if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      bottomNav.style.transform = "translateY(0)";
      scrollBtnDown.style.display = "none";
    } else if (prevScrollpos > currentScrollPos) {
      bottomNav.style.transform = "translateY(100%)";
      scrollBtnDown.style.display = "none";
    } else {
      bottomNav.style.transform = "translateY(0)";
      scrollBtnDown.style.display = "block";
    }
    prevScrollpos = currentScrollPos;

  }, 100);

});

window.addEventListener('beforeunload', () => {

  medlistSearchBox.value.trim() !== "" ? sessionStorage.setItem("searchValue", medlistSearchBox.value) : sessionStorage.removeItem("searchValue");

  sessionStorage.setItem("scrollPos", document.documentElement.scrollTop);
});



// const enCred = (pass) => {
//   console.log(CryptoJS.AES.encrypt("", pass).toString());
// };
// enCred = ("");

// const deCred = (pass) => {
//   console.log(CryptoJS.AES.decrypt("", pass).toString(CryptoJS.enc.Utf8));
// };
// deCred("");

// const hash = (message) => {
//   console.log(CryptoJS.SHA3(message).toString());
// };
// hash("janaushadhimrj");

