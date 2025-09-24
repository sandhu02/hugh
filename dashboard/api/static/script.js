
document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("refreshBtn");
    const status = document.getElementById("status");
    const table = document.getElementById("resultsTable");

    button.addEventListener("click", async function () {
        button.disabled = true;
        button.innerText = "Refreshing...";
        // status.innerText = "Fetching new results... please wait";

        try {
            const response = await fetch("/refresh-scraper");
            const result = await response.json();

            status.innerText = result.message;

            // clear old rows (except header)
            table.innerHTML = `
              <tr>
                <th>Site</th>
                <th>Keyword</th>
                <th>Title</th>
                <th>URL</th>
                <th>Snippet</th>
                <th>Date</th>
                <th>Image</th>
                <th>Section</th>
              </tr>`;

            // add new rows
            result.data.forEach(r => {
                const row = table.insertRow();
                row.innerHTML = `
                    <td>${r.site}</td>
                    <td>${r.keywords}</td>
                    <td>${r.title}</td>
                    <td><a href="${r.url}" target="_blank">Link</a></td>
                    <td>${r.snippet}</td>
                    <td>${r.date}</td>
                    <td><img src="${r.image}" width="80"></td>
                    <td>${r.section}</td>
                `;
            });
            button.innerText = "Fetch New Results";
        } catch (err) {
            status.innerText = "Error fetching data.";
            button.innerText = "Fetch New Results";
            console.error(err);
        } finally {
            button.disabled = false;
        }
    });
});

