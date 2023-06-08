import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
let octokit;
// login,pass => janaushadhi,janaushadhimrj;

const loggedIn = localStorage.getItem("gt") ? true : false;

console.log("loggedIn => " + loggedIn);

const medlistList = document.getElementById("medlistList");
const medlistSearchBox = document.getElementById("medlistSearchBox");
const medlistSearchBoxClear = document.getElementById("medlistSearchBoxClear");

let jsonMeds = [], jsonMedsAvl = [];

async function fetchData() {

  if (loggedIn) {

    octokit = new Octokit({ auth: localStorage.getItem("gt") });

    const [medsDataResponse, { data: { content } }] = await Promise.all([

      fetch("/assets/json/meds-data-min.json"),

      octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: 'amitexm',
        repo: 'medsy',
        path: 'assets/json/meds-avl-min.json',
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    ]);

    var jsonMedsData = await medsDataResponse.json();

    jsonMedsAvl = JSON.parse(CryptoJS.enc.Base64.parse(content.replace(/\n/g, "")).toString(CryptoJS.enc.Utf8));

  } else {

    const [medsDataResponse, medsAvlResponse] = await Promise.all([
      fetch("/assets/json/meds-data-min.json"),
      fetch("/assets/json/meds-avl-min.json?qs=" + Date.now())
    ]);

    var jsonMedsData = await medsDataResponse.json();

    jsonMedsAvl = await medsAvlResponse.json();
  }

  for (let i = 0; i < jsonMedsData.length; i++) {
    jsonMeds.push({
      ...jsonMedsData[i],
      ...jsonMedsAvl.find((item) => item.dc === jsonMedsData[i].dc),
    });
  }
  // console.log(jsonMeds);
  return jsonMeds;
}

function listMeds(data, toAppend) {
  // standalone function for displaying list from 'data' js object.

  const arrLength = data.length;
  const divideInto = 6;
  const chunkSize = Math.trunc(arrLength / divideInto);

  const rem = arrLength % 6;

  let iteration = 0;

  const iterations = rem ? divideInto : divideInto + 1;

  toAppend.innerHTML = "";

  setTimeout(function generateRows() {
    const base = chunkSize * iteration;
    const loopSize = iteration != 6 ? base + chunkSize : base + rem;
    let text = "";

    for (let i = base; i < loopSize; i++) {
      text = text +
        `<li class="list-group-item d-flex ps-3 pb-3 ${data[i].avl ? "list-group-item-success" : "list-group-item-danger"}">
          <div class="w-100">
          <div>${data[i].gn}</div>
            <div class="d-flex justify-content-between text-muted pe-2 mt-1">
              <small>(${data[i].dc})</small>
              <small>${data[i].us}</small>
              <small>${data[i].mrp ? "Rs. " + data[i].mrp : "Under Processing"}</small>
              ${loggedIn ? `<input type="checkbox" data-dc="${data[i].dc}" ${data[i].avl ? "checked" : ""}>` : ""}
            </div>
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
    }
  }, 0);
}

function filterMeds(value) {
  let filter = value.toLowerCase().trim();

  let li = medlistList.getElementsByTagName("li");

  const rowCount = li.length;
  const divideInto = 6;
  const chunkSize = rowCount / divideInto;
  let iteration = 0;

  setTimeout(function generateRows() {
    const base = chunkSize * iteration;
    const loopSize = base + chunkSize;

    // Loop through all list items, and hide those who don't match the search query

    let liElm, i, txtValue;

    for (i = base; i < loopSize; i++) {
      liElm = li[i].children[0].children[0];

      txtValue = liElm.textContent || liElm.innerText;

      if (txtValue.toLowerCase().trim().indexOf(filter) > -1) {
        if (li[i].hasAttribute("style")) li[i].removeAttribute("style");
      } else if (!li[i].hasAttribute("style")) {
        li[i].setAttribute("style", "display:none!important");
      }
    }

    iteration++;

    if (iteration < divideInto) setTimeout(generateRows, 0);
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

    timer = setTimeout(() => {
      filterMeds(value);
    }, 300);

    document.documentElement.scrollTop = 0;

  });

  // medlist search box clear button

  medlistSearchBoxClear.addEventListener("click", () => {
    medlistSearchBox.value = "";
    medlistSearchBox.dispatchEvent(new Event("input", { bubbles: true }));
  });


  // let scrollPos = sessionStorage.getItem("scrollPos");
  // console.log(scrollPos);

  // setTimeout(() => {
  //   if (scrollPos !== null) {
  //     document.documentElement.scrollTop = parseInt(scrollPos, 10);
  //     console.log("scrolled");
  //   }
  // });



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
          setTimeout(() => {
            window.location.reload();
          }, 2000);

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

  const modalLogin = document.getElementById('modalLogin');
  modalLogin.addEventListener('hidden.bs.modal', () => {
    loginForm.classList.remove("was-validated");
    loginForm.elements.submitBtn.disabled = false;
    loginForm.elements.submitBtn.innerHTML = "Sign In";
    loginForm.reset();
    alertPlaceholder.innerHTML = "";
  });

  const loaderBody = document.getElementById('loaderBody');
  loginBtn.addEventListener("click", () => {
    let loginModal = new bootstrap.Modal('#modalLogin', {});
    loaderBody.style.display = "block";
    setTimeout(() => {
      loaderBody.style.display = "none";
      loginModal.show();
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

}

else {

  const { data: { id } } = await octokit.request("/user");
  console.log(id);

  /** Logged UI */

  loginBtn.innerHTML = "Logout";
  loginBtn.addEventListener("click", () => {
    loaderBody.style.display = "block";
    localStorage.removeItem("gt");
    setTimeout(() => {
      loaderBody.style.display = "none";
      window.location.reload();
    }, 1000);
  });

  document.querySelector('#bottomNav').classList.remove("d-none");


  /*** Logged In Operations */

  const btnUpdationQueue = document.getElementById("btnUpdationQueue");
  const counterBtnUpdationQueue = document.getElementById("counterBtnUpdationQueue");

  const btnUpdate = document.getElementById("btnUpdate");
  const counterBtnUpdate = document.getElementById("counterBtnUpdate");

  const medlistUpdateQueueDialog = document.getElementById("medlistUpdateQueueDialog");

  var updationQueue = [];

  medlistList.addEventListener("click", editUpdationQueue);

  function editUpdationQueue(e) {

    if ("checkbox" === e.target.type) {
      let dc = parseInt(
        e.target.parentElement.children[0].innerHTML.match(/\d+/)
      );

      // Find medicine and change its Availability in jsonMeds(generated by combining jsonMedsData and jsonMedsAvl in fetchdata()).
      let dc_jsonMedsIndx = jsonMeds.findIndex((item) => item.dc === dc);
      jsonMeds[dc_jsonMedsIndx].avl = Number(e.target.checked);

      // Find medicine and change its Availability in jsonMedsAvl. Both arrays are sorted so they should contain same medicine at same index.
      if (jsonMeds[dc_jsonMedsIndx].dc === jsonMedsAvl[dc_jsonMedsIndx].dc) {
        jsonMedsAvl[dc_jsonMedsIndx].avl = Number(e.target.checked);
      } else {
        let dc_jsonMedsAvlIndx = jsonMedsAvl.findIndex((item) => item.dc === dc);
        jsonMedsAvl[dc_jsonMedsAvlIndx].avl = Number(e.target.checked);
        alert("Discrepancy. Found other way around. Try sorting again.");
      }

      let dc_updationQueueIndx = updationQueue.findIndex((item) => item.dc === dc);

      if (dc_updationQueueIndx > -1) {
        updationQueue.splice(dc_updationQueueIndx, 1);
      } else {
        var updationMed = {
          dc: dc,
          gn: jsonMeds[dc_jsonMedsIndx].gn,
          us: jsonMeds[dc_jsonMedsIndx].us,
          mrp: jsonMeds[dc_jsonMedsIndx].mrp,
          avl: jsonMeds[dc_jsonMedsIndx].avl,
        };

        updationQueue.push(updationMed);
      }

      let counterUpdationQueue = updationQueue.length ? updationQueue.length : "";
      counterBtnUpdationQueue.innerHTML = counterUpdationQueue;
      counterBtnUpdate.innerHTML = counterUpdationQueue;
    }

    e.stopPropagation(); //warning
  }

  /** Event listener for when first Update button in medlist screen is clicked.
   * It resets the Updation Queue Dialog by setting its innerHTML to empty string.
   * Then regenerates the list in Updation Queue Dialog from the updationQueue[] array reusing the listMeds function.
  **/
  btnUpdationQueue.addEventListener("click", function () {

    let text = "";

    for (let i = 0; i < updationQueue.length; i++) {
      text = text +
        `<li class="list-group-item d-flex ps-3 pb-3 ${updationQueue[i].avl ? "list-group-item-success" : "list-group-item-danger"}">
            <div>${i + 1}. </div>
            <div class="w-100">
              <div class="h6">${updationQueue[i].gn}</div>
              <div class="d-flex justify-content-between text-muted pe-2 mt-1">
                <small>(${updationQueue[i].dc})</small>
                <small>${updationQueue[i].us}</small>
                <small>${updationQueue[i].mrp ? "Rs. " + updationQueue[i].mrp : "Under Processing"}</small>
                <input type="checkbox" data-dc="${updationQueue[i].dc}" ${updationQueue[i].avl ? "checked" : ""}>
              </div>
            </div>
        </li>`;
    }

    if (text) {
      medlistUpdateQueueDialog.innerHTML = text;
    }
  });

  /** Event Listener for when med checkbox in Update Queue Dialog is clicked upon.
   * It catches the event and does the following operations.
   */
  medlistUpdateQueueDialog.addEventListener("click", function (e) {
    if ("checkbox" === e.target.type) {
      // reusing the function to remove the clicked meds object from updationQueue[] array.
      editUpdationQueue(e);

      // code to restore the med's previous state (check/unchecked) in medlist when med is removed from UpdateQueue dialog.
      const medCbxClickedSelector = `[data-dc="${e.target.dataset.dc}"]`;
      // Select element inside main list
      let medlistList_medCbx = medlistList.querySelector(medCbxClickedSelector);
      medlistList_medCbx.checked = !medlistList_medCbx.checked;

      // Select element inside search list
      // let searchResults_medCbx = medlistListSearchResults.querySelector(medCbxId);
      // if(searchResults_medCbx != null) searchResults_medCbx.checked = !searchResults_medCbx.checked; //Discard if not in search result

      // finally remove the med's parent container (li) element from updation queue dialog with a fade out effect.
      e.target.parentElement.parentElement.parentElement.style.transition =
        "opacity 0.5s ease";
      e.target.parentElement.parentElement.parentElement.style.opacity = 0;

      setTimeout(() => { e.target.parentElement.parentElement.parentElement.remove() }, 500);
    }

    // stope event propagation going any further then where event listener is added (medlistUpdateQueueDialog).
    e.stopPropagation(); //warning
  });


  const btnUpdateText = btnUpdate.querySelector('#updateBtn-text');
  const btnUpdateStatus = btnUpdate.querySelector('#btnUpdate-status');
  const btnClose = document.querySelector('#btnClose');
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

      setTimeout(() => {
        btnClose.addEventListener('click', function btnCloseHandler() {
          btnUpdate.disabled = false;
          btnUpdateText.innerHTML = "Update";
          btnUpdate.style.backgroundColor = "#5757E7";
          btnUpdateStatus.style.display = "none";
          this.removeEventListener('click', btnCloseHandler);
        });
      }, 2000);


      const path = "assets/json/meds-avl-min.json";

      const sha = await getSHA(path);

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
        btnClose.innerHTML = "Close";
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





  async function orequest() {

    const {
      data: { sha },
    } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: "amitexm",
      repo: "medsy",
      path: "assets/json/meds-test3.json",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    console.log(sha);

    const { status } = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner: "amitexm",
        repo: "medsy",
        path: "assets/json/meds-test3.json",
        message: "change avl",
        committer: {
          name: "amitexm",
          email: "amitexm@github.com",
        },
        content: "bmV3IGZpbGUgY29udGVudCB1cGRhdGVk",
        sha: sha,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    console.log(status);

  }


}


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

