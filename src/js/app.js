window.addEventListener("load", () => {
  getElement(".spinner-modal").style.display = "none";
});

// NOTE Functions !!
const getElement = (el) => document.querySelector(el);

const select = getElement("#suppliers");
const suppliers = new Set();
const tbody = getElement("tbody");

// NOTE Render Table !!!
const render = (result, socket) => {
  tbody.innerHTML = "";
  result.forEach((item) => {
    const tr = document.createElement("tr");

    const tdItemCode = document.createElement("td");
    tdItemCode.textContent = item.ItemCode;

    const tdItemName = document.createElement("td");
    tdItemName.textContent = item.ItemName;

    const tdSupplier = document.createElement("td");
    tdSupplier.textContent = item.Supplier || "/";
    suppliers.add(item.Supplier);

    const tdPrice = document.createElement("td");
    tdPrice.innerHTML = item.Price + " &euro;" || "/";

    const tdOrders = document.createElement("td");
    tdOrders.textContent = item.ArticleInOrders || "/";

    const tdAverage = document.createElement("td");
    tdAverage.textContent = "/";

    const tdInWarehouse = document.createElement("td");
    tdInWarehouse.textContent = item.onHand || "/";

    getElement(".total-price").innerHTML = item.TotalPrice + " &euro;";
    getElement(".sum-of-articles").textContent = item.SumOfArticles || "";
    if (item.AvgArticleByOrder) {
      getElement(".average-articles").textContent =
        item.AvgArticleByOrder.toFixed(2) || "";
    }

    tr.append(tdItemCode);
    tr.append(tdItemName);
    tr.append(tdSupplier);
    tr.append(tdPrice);
    tr.append(tdOrders);
    tr.append(tdAverage);
    tr.append(tdInWarehouse);
    tbody.append(tr);
  });

  // NOTE Create Select Supplier Dropdown !!!
  suppliers.forEach((supplier) => {
    const option = document.createElement("option");
    option.setAttribute("value", supplier);
    option.className = "suppliers";
    option.textContent = supplier;

    option.addEventListener("click", (e) => {
      socket.send(JSON.stringify({ supplier: e.target.value }));
    });
    if (!select[5]) {
      select.append(option);
    }
  });
  getElement(".all-suppliers").addEventListener("click", () => {
    socket.send(JSON.stringify({ supplier: "all" }));
  });
};

const formatedDate = () => {
  const date = new Date();

  let day = date.getDate();
  if (day < 10) day = `0${day}`;

  let month = date.getMonth() + 1;
  if (month < 10) month = `0${month}`;

  let year = date.getFullYear();

  return `${year}-${month}-${day}`;
};

const compareDate = (a, b) => {
  const dateA = new Date(a);
  const dateB = new Date(b);

  if (dateB < dateA) return false;
  return true;
};

const prependZero = (value) => {
  return value
    .split(".")
    .map((el) => {
      if (el < 10) {
        return (el = "0" + el);
      } else {
        return el;
      }
    })
    .reverse()
    .join("-");
};

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

(async function connect() {
  let socket = await new WebSocket("ws://localhost:3000");
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
      title: "Disconnected !!!",
      timer: 2000,
    });
    intervalId = setTimeout(() => {
      connect();
    }, 5000);
  });

  // NOTE Export .csv or render list !!!
  socket.addEventListener("message", async (data) => {
    const result = await JSON.parse(data.data);
    if (result.type === "csv") {
      try {
        function convertArrayOfObjectsToCSV(args) {
          let result, ctr, keys, columnDelimiter, lineDelimiter, data;

          data = args.data || null;
          if (data == null || !data.length) {
            return null;
          }

          columnDelimiter = args.columnDelimiter || ",";
          lineDelimiter = args.lineDelimiter || "\n";

          keys = Object.keys(data[0]);

          result = "";
          result += keys.join(columnDelimiter);
          result += lineDelimiter;

          data.forEach(function (item) {
            ctr = 0;
            keys.forEach(function (key) {
              if (ctr > 0) result += columnDelimiter;

              result += item[key];
              ctr++;
            });
            result += lineDelimiter;
          });

          return result;
        }
        (function downloadCSV() {
          let data, filename, link;
          let csv = convertArrayOfObjectsToCSV({
            data: result.data,
          });
          if (csv == null) return;

          filename = "data.csv";

          if (!csv.match(/^data:text\/csv/i)) {
            csv = "data:text/csv;charset=utf-8," + csv;
          }
          data = encodeURI(csv);

          link = document.createElement("a");
          link.setAttribute("href", data);
          link.setAttribute("download", filename);
          link.click();
        })();
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
  getElement(".export").addEventListener("click", (e) => {
    e.preventDefault();
    try {
      socket.send(JSON.stringify({ type: "csv" }));
    } catch (error) {
      console.log(error.message);
    }
  });
})();
