import {
  getElement,
  render,
  formatedDate,
  prependZero,
  compareDate,
} from "./functions.js";

window.addEventListener("load", () => {
  getElement(".spinner-modal").style.display = "none";
});

// NOTE Datepicker !!!
const options = { year: "numeric", month: "numeric", day: "numeric" };
const dateFrom = datepicker("#date-from", {
  formatter: (input, date, instance) => {
    const value = date.toLocaleDateString("de-DE", options);

    // NOTE prepend zero !!!
    const formatted = prependZero(value);
    input.value = formatted;
  },
});
const dateTo = datepicker("#date-to", {
  formatter: (input, date, instance) => {
    const value = date.toLocaleDateString("de-DE", options);

    // NOTE prepend zero !!!
    const formatted = prependZero(value);
    input.value = formatted;
  },
});

// NOTE WebSocket !!!
let socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", () => {
  console.log("We are connected !");
  Swal.fire({
    icon: "success",
    title: "Connected !",
    timer: 2000,
  });
});
socket.addEventListener("close", () => {
  console.log("Disconnected !");
  Swal.fire({
    icon: "error",
    title: "Disconnected !",
    timer: 2000,
  });
});

// NOTE Export .csv or render list !!!
socket.addEventListener("message", async (data) => {
  const result = await JSON.parse(data.data);
  if (result.type === "csv") {
    try {
      const downloadCsv = document.createElement("a");
      downloadCsv.setAttribute("href", "backend/" + result.path);
      downloadCsv.setAttribute("target", "_blank");
      downloadCsv.setAttribute("download", "data.csv");

      downloadCsv.click();
    } catch (error) {
      console.log(error.message);
    }
  } else {
    render(result, socket);
  }
});

// NOTE Form !!!
const dateFromBtn = getElement(".date-from-btn");
const dateToBtn = getElement(".date-to-btn");

dateFromBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const today = formatedDate();
  getElement("#date-from").value = today;
});
dateToBtn.addEventListener("click", (e) => {
  e.preventDefault();
  const today = formatedDate();
  getElement("#date-to").value = today;
});

// NOTE Item Code Autocomplete !!!
getElement("#item-code").addEventListener("keyup", (e) => {
  socket.send(JSON.stringify({ itemCode: e.target.value }));
  getElement("#item-name").value = "";
});
// NOTE Item Name Autocomplete !!!
getElement("#item-name").addEventListener("keyup", (e) => {
  socket.send(JSON.stringify({ itemName: e.target.value }));
  getElement("#item-code").value = "";
});
// NOTE Payment !!!
getElement("#payment").addEventListener("change", (e) => {
  socket.send(JSON.stringify({ payment: e.target.value }));
});

// NOTE Submit form !!!
const submitBtn = getElement(".send");
submitBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const formData = { type: "form" };

  formData.dateFrom = getElement("#date-from").value;
  formData.dateTo = getElement("#date-to").value;

  if (!formData.dateFrom || !formData.dateTo) {
    Swal.fire({
      icon: "error",
      title: "Date fields are required !",
      timer: 2000,
    });
    return;
  }
  if (!compareDate(formData.dateFrom, formData.dateTo)) {
    Swal.fire({
      icon: "error",
      title: "Incorrect date values !",
      timer: 2000,
    });
    return;
  }

  socket.send(JSON.stringify(formData));
});

// NOTE Export CSV !!!
getElement(".export").addEventListener("click", () => {
  try {
    getElement(".spinner-modal").style.display = "flex";
    socket.send(JSON.stringify({ type: "csv" }));
  } catch (error) {
    console.log(error.message);
  } finally {
    getElement(".spinner-modal").style.display = "none";
  }
});
