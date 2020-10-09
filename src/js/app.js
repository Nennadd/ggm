window.addEventListener("load", () => {
  getElement(".spinner-modal").style.display = "none";

  // NOTE Datepicker and event listeners on date buttons !!!
  pickDate("date-from");
  pickDate("date-to");

  // NOTE WebSocket !!!
  (async function connect() {
    let socket = new WebSocket("ws://localhost:3000");
    socket.addEventListener("open", () => {
      console.log("We are connected !");
      showMessage("success", "Connected");
    });

    let csvExportData;
    // NOTE Set export .csv data & render list !!!
    socket.addEventListener("message", async (data) => {
      const result = await JSON.parse(data.data);
      csvExportData = await result;
      try {
        getElement(".spinner-modal").style.display = "flex";
        await render()(result);
      } catch (error) {
        console.log(error);
      } finally {
        getElement(".spinner-modal").style.display = "none";
      }
    });

    // NOTE Item Code Autocomplete !!!
    getElement("#item-code").addEventListener("keyup", (e) => {
      return sendRequest(socket, { itemCode: e.target.value }, "#item-name");
    });
    // NOTE Item Name Autocomplete !!!
    getElement("#item-name").addEventListener("keyup", (e) => {
      return sendRequest(socket, { itemName: e.target.value }, "#item-code");
    });
    // NOTE Payment !!!
    getElement("#payment").addEventListener("change", (e) => {
      return sendRequest(socket, { payment: e.target.value });
    });
    getElement(".payment-all").addEventListener("click", (e) => {
      return sendRequest(socket, { payment: e.target.value });
    });
    // NOTE Suppliers !!!
    getElement("#suppliers").addEventListener("change", (e) => {
      return sendRequest(socket, { supplier: e.target.value });
    });
    getElement(".all-suppliers").addEventListener("click", (e) => {
      return sendRequest(socket, { supplier: e.target.value });
    });

    // NOTE Submit form !!!
    const submitBtn = getElement(".send");
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const formData = { type: "form" };

      formData.dateFrom = getElement("#date-from").value;
      formData.dateTo = getElement("#date-to").value;

      if (!formData.dateFrom || !formData.dateTo) {
        return showMessage("error", "Date fields are required !");
      }
      if (!compareDate(formData.dateFrom, formData.dateTo)) {
        return showMessage("error", "Incorrect date values !");
      }
      if (isOpen(socket)) {
        socket.send(JSON.stringify(formData));
        resetForm();
      }
    });

    // NOTE Export CSV !!!
    getElement(".export").addEventListener("click", (e) => {
      if (isOpen(socket)) {
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
              data: csvExportData,
            });
            if (csv == null) {
              showMessage("error", "No data for export !");
              return;
            }

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
      }
    });

    socket.addEventListener("error", () => {
      console.log("Reconnecting ....");
    });
    socket.addEventListener("close", () => {
      showMessage("error", "Disconnected !");
      intervalId = setTimeout(() => {
        connect();
      }, 5000);
    });
  })();
});
