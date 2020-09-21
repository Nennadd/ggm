import { getElement, render, formatedDate } from "./functions.js";

// NOTE Datepicker !!!
const options = { year: "numeric", month: "numeric", day: "numeric" };

const dateFrom = datepicker("#date-from", {
  formatter: (input, date, instance) => {
    const value = date.toLocaleDateString("de-DE", options);
    input.value = value;
  },
});
const dateTo = datepicker("#date-to", {
  formatter: (input, date, instance) => {
    const value = date.toLocaleDateString("de-DE", options);
    input.value = value;
  },
});

// NOTE WebSocket !!!
let socket = new WebSocket("ws://localhost:3000");

socket.addEventListener("open", () => {
  //   socket.send("ajoj");
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
socket.addEventListener("message", async (data) => {
  const result = await JSON.parse(data.data);
  render(result, socket);
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

const submitBtn = getElement(".send");
submitBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const formData = {};
  formData.supplier = getElement("#suppliers").value;
  formData.payment = getElement("#payment").value;
  formData.dateFrom = getElement("#date-from").value;
  formData.dateTo = getElement("#date-to").value;
  formData.tasks = getElement("#item-code").value;
  formData.article = getElement("#item-name").value;

  //   console.log(formData);
});
