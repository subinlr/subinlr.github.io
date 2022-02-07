// Serviceworker registration
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceworker.js")
    .then((reg) => console.log("service worker registered"))
    .catch((err) => console.log("service worker not registered", err));
}

// State
const state = {
  loanDetails: {
    loanDate: "",
    loanAmount: "",
    rateOfInterest: "",
    tenure: "",
  },
  EMI: null,
  records: [],
  onEditRecord: false,
};

// Elements
const form = document.querySelector("form");
const loanDateInput = document.querySelector("#loanDate");
const loanAmountInput = document.querySelector("#loanAmount");
const rateOfInterestInput = document.querySelector("#rateOfInterest");
const tenureInput = document.querySelector("#tenure");
const showEMI = document.querySelector("#showEMI");
const showDueDate = document.querySelector("#showDueDate");
const showEndDate = document.querySelector("#showEndDate");
const showTenure = document.querySelector("#showTenure");
const showTotalInterest = document.querySelector("#showTotalInterest");
const showTotalAmount = document.querySelector("#showTotalAmount");
const clearBtn = document.querySelector("#clearBtn");
const sideBar = document.querySelector("#sideBar");
const viewRecordsBtn = document.querySelector("#viewRecordsBtn");
const closeRecordsBtn = document.querySelector("#closeRecordsBtn");
const addRecordBtn = document.querySelector("#addRecordBtn");
const recordsContainer = document.querySelector("#recordsContainer");
const loanDetailsContainer = document.querySelector("#loanDetailsContainer");

// Templates
const recordTemplate = document.querySelector("#recordTemplate").innerHTML;
const editButtonsTemplate = document.querySelector(
  "#editButtonsTemplate"
).innerHTML;

// Events
window.addEventListener("load", () => {
  const records = JSON.parse(localStorage.getItem("EMI-Records"));
  state.records = !!records ? records : [];
  renderRecords();
});

loanDateInput.addEventListener("input", (e) => {
  state.loanDetails.loanDate = e.target.value;
});

loanAmountInput.addEventListener("input", (e) => {
  const loanAmount = e.target.value;

  if (loanAmount === "." && state.loanDetails.loanAmount === "") {
    state.loanDetails.loanAmount = "0.";
    return (loanAmountInput.value = state.loanDetails.loanAmount);
  }

  if (!loanAmount || loanAmount.match(/^\d{1,}(\.\d{0,2})?$/)) {
    return (state.loanDetails.loanAmount = parseFloat(e.target.value));
  }

  loanAmountInput.value = state.loanDetails.loanAmount;
});

rateOfInterestInput.addEventListener("input", (e) => {
  const rateOfInterest = e.target.value;

  if (rateOfInterest === "." && state.loanDetails.rateOfInterest === "") {
    state.loanDetails.rateOfInterest = "0.";
    return (rateOfInterestInput.value = state.loanDetails.rateOfInterest);
  }

  if (!rateOfInterest || rateOfInterest.match(/^\d{1,}(\.\d{0,2})?$/)) {
    return (state.loanDetails.rateOfInterest = parseFloat(e.target.value));
  }

  rateOfInterestInput.value = state.loanDetails.rateOfInterest;
});

tenureInput.addEventListener("input", (e) => {
  state.loanDetails.tenure = parseFloat(e.target.value);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const mediaMatch = window.matchMedia("(max-width: 736px)");

  if (mediaMatch.matches) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  state.EMI = findEMI(state.loanDetails);
  updateCount(state.EMI.EMI, showEMI);
  showDueDate.innerHTML = state.EMI.dueDate;
  showEndDate.innerHTML = state.EMI.endDate;
  updateCount(state.EMI.tenure, showTenure);
  updateCount(
    state.EMI.EMI * state.EMI.tenure - state.EMI.loanAmount,
    showTotalInterest
  );
  updateCount(state.EMI.EMI * state.EMI.tenure, showTotalAmount);
  addRecordBtn.disabled = false;
});

clearBtn.addEventListener("click", () => {
  clearScreen();
});

addRecordBtn.addEventListener("click", () => {
  vex.dialog.open({
    message: "Enter applicant name:",
    overlayClosesOnClick: false,
    input: [
      '<input name="applicantName" type="text" placeholder="Name" autocomplete="off" required />',
    ].join(""),
    buttons: [vex.dialog.buttons.YES, vex.dialog.buttons.NO],
    callback: function ({ applicantName }) {
      if (applicantName) {
        const record = {
          _id: generateUUID(),
          applicantName,
          loanDetails: state.loanDetails,
          EMI: state.EMI,
          createdAt: moment().format("LLL"),
        };

        state.records.push(record);
        localStorage.setItem("EMI-Records", JSON.stringify(state.records));
        renderRecords();

        iziToast.show({
          title: "Successfully added.",
          titleColor: "#ffffff",
          titleSize: "18px",
          icon: "fa fa-check",
          iconColor: "#ffffff",
          backgroundColor: "#00c853",
        });
      }
    },
  });
});

viewRecordsBtn.addEventListener("click", () => {
  const mediaMatch = window.matchMedia("(max-width: 736px)");

  mediaMatch.matches
    ? (sideBar.style.width = "100%")
    : (sideBar.style.width = "30rem");

  setTimeout(() => {
    recordsContainer.style.opacity = "1";
  }, 400);
});

closeRecordsBtn.addEventListener("click", () => {
  recordsContainer.style.opacity = "0";
  setTimeout(() => {
    sideBar.style.width = "0";
  }, 400);
});

// Functions
const updateCount = (data, element) => {
  element.innerText = "0";

  const update = () => {
    const target = +data;
    const count = +element.innerText;
    const speed = 200;

    const inc = target / speed;

    if (count < target) {
      element.innerText = Math.ceil(count + inc);
      setTimeout(update, 1);
    } else {
      element.innerText = target;
    }
  };

  update();
};

const clearScreen = () => {
  form.reset();
  showEMI.innerHTML = 0;
  showDueDate.innerHTML = "-";
  showEndDate.innerHTML = "-";
  showTenure.innerHTML = 0;
  showTotalInterest.innerHTML = 0;
  showTotalAmount.innerHTML = 0;
  addRecordBtn.disabled = true;
};

const generateUUID = () => {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
};

const renderRecords = () => {
  recordsContainer.innerHTML = null;
  state.records.map((record) => {
    const html = Mustache.render(recordTemplate, record);
    recordsContainer.insertAdjacentHTML("afterbegin", html);
  });
};

const viewRecord = (_id) => {
  const [record] = state.records.filter((record) => record._id === _id);
  vex.dialog.open({
    input: [
      `<div class="text-center record-name">
        <p>EMI Details of ${record.applicantName}</p>
      </div>
      <div class="record-title text-center">
        <h1>EMI</h1>
      </div>
      <div class="record-result">
        <h2>Rs. <span>${record.EMI.EMI}</span> / Month</h2>
      </div>
      <div class="loan-details">
      <div class="detail">
        <p>Loan Date</p>
        <p>${moment(record.loanDetails.loanDate, "YYYY-MM-DD").format(
          "MMMM Do YYYY"
        )}</p>
      </div>
      <div class="detail">
        <p>Due Date</p>
        <p>${record.EMI.dueDate}</p>
      </div>
      <div class="detail">
        <p>End Date</p>
        <p>${record.EMI.endDate}</p>
      </div>
      <div class="detail">
        <p>Tenure</p>
        <p>${record.EMI.tenure}</p>
      </div>
      <div class="detail">
        <p>Loan Amount</p>
        <p>Rs. <span>${record.EMI.loanAmount}</span></p>
      </div>
      <div class="detail">
        <p>Total Interest</p>
        <p>Rs. <span>${
          record.EMI.EMI * record.EMI.tenure - record.EMI.loanAmount
        }</span></p>
      </div>
      <div class="detail">
        <p>Total Amount</p>
        <p>Rs. <span>${record.EMI.EMI * record.EMI.tenure}</span></p>
      </div>
    </div>`,
    ].join(""),
    buttons: [],
  });
};

const editRecord = (_id) => {
  if (state.onEditRecord) {
    return vex.dialog.open({
      message:
        "Save or cancel currently editing record before editing a new record.",
      callback: function (value) {
        if (value) {
          recordsContainer.style.opacity = "0";
          setTimeout(() => {
            sideBar.style.width = "0";
          }, 400);
        }
      },
      buttons: [vex.dialog.buttons.YES],
    });
  }

  recordsContainer.style.opacity = "0";
  setTimeout(() => {
    sideBar.style.width = "0";
  }, 400);

  const [record] = state.records.filter((record) => record._id === _id);
  state.onEditRecord = true;
  state.loanDetails = record.loanDetails;
  state.EMI = record.EMI;

  updateCount(state.EMI.EMI, showEMI);
  showDueDate.innerHTML = state.EMI.dueDate;
  showEndDate.innerHTML = state.EMI.endDate;
  updateCount(state.EMI.tenure, showTenure);
  updateCount(
    state.EMI.EMI * state.EMI.tenure - state.EMI.loanAmount,
    showTotalInterest
  );
  updateCount(state.EMI.EMI * state.EMI.tenure, showTotalAmount);

  loanDateInput.value = state.loanDetails.loanDate;
  loanAmountInput.value = state.loanDetails.loanAmount;
  rateOfInterestInput.value = state.loanDetails.rateOfInterest;
  tenureInput.value = state.loanDetails.tenure;

  addRecordBtn.hidden = true;
  const html = Mustache.render(editButtonsTemplate, record);
  loanDetailsContainer.insertAdjacentHTML("beforeend", html);
};

const saveRecord = (_id) => {
  const [record] = state.records.filter((record) => record._id === _id);
  const records = state.records.filter((record) => record._id !== _id);

  records.push({
    ...record,
    loanDetails: state.loanDetails,
    EMI: state.EMI,
    createdAt: moment().format("LLL"),
  });

  state.onEditRecord = false;

  const editActionButtons = document.querySelector("#editActionButtons");
  editActionButtons.parentNode.removeChild(editActionButtons);
  addRecordBtn.hidden = false;
  clearScreen();

  iziToast.show({
    title: "Successfully saved.",
    titleColor: "#ffffff",
    titleSize: "18px",
    icon: "fa fa-check",
    iconColor: "#ffffff",
    backgroundColor: "#00c853",
  });

  state.records = records;
  localStorage.setItem("EMI-Records", JSON.stringify(records));
  renderRecords();
};

const cancelEditRecord = () => {
  state.onEditRecord = false;

  const editActionButtons = document.querySelector("#editActionButtons");
  editActionButtons.parentNode.removeChild(editActionButtons);
  addRecordBtn.hidden = false;
  clearScreen();

  iziToast.show({
    title: "Successfully cancelled.",
    titleColor: "#ffffff",
    titleSize: "18px",
    icon: "fa fa-check",
    iconColor: "#ffffff",
    backgroundColor: "#00c853",
  });
};

const deleteRecord = (_id) => {
  vex.dialog.open({
    message: "Are you sure you want to delete this record?",
    overlayClosesOnClick: false,
    callback: function (value) {
      if (value) {
        const records = state.records.filter((record) => record._id !== _id);
        state.records = records;
        localStorage.setItem("EMI-Records", JSON.stringify(records));
        renderRecords();
        iziToast.show({
          title: "Successfully deleted.",
          titleColor: "#ffffff",
          titleSize: "18px",
          icon: "fa fa-check",
          iconColor: "#ffffff",
          backgroundColor: "#00c853",
        });
      }
    },
    buttons: [vex.dialog.buttons.YES, vex.dialog.buttons.NO],
  });
};

const findEMI = (loanDetails) => {
  const loanAmount = loanDetails.loanAmount;
  const rateOfInterest = loanDetails.rateOfInterest;
  const tenure = loanDetails.tenure;

  const loanDate = moment(loanDetails.loanDate, "YYYY-MM-DD").valueOf();
  const loanDay = moment(loanDate).get("date");

  let dueDate;

  if (loanDay >= 1 && loanDay <= 10) {
    dueDate = moment(loanDate).add(1, "months").set("date", 5);
  } else if (loanDay >= 11 && loanDay <= 20) {
    dueDate = moment(loanDate).add(1, "months").set("date", 10);
  } else if (
    loanDay >= 21 &&
    loanDay <= moment(loanDate).endOf("month").get("date")
  ) {
    dueDate = moment(loanDate).add(2, "months").set("date", 5);
  }

  const endDate = moment(dueDate).add(tenure - 1, "months");
  const totalDays =
    dueDate.diff(moment(loanDate), "days") + endDate.diff(dueDate, "days");
  const yearlyInterest = (loanAmount * rateOfInterest) / 100;
  const dayInterest = yearlyInterest / 365;
  const totalInterest = dayInterest * totalDays;
  const totalAmount = loanAmount + totalInterest;
  const EMI = totalAmount / tenure;

  return {
    EMI: Math.ceil(EMI),
    dueDate: dueDate.format("MMMM Do YYYY"),
    endDate: endDate.format("MMMM Do YYYY"),
    tenure,
    loanAmount,
  };
};
