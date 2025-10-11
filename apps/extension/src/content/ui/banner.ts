const svg =
  "data:image/svg+xml;base64,PHN2ZyBpZD0iYSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTA0LjI1IDEzLjI1Ij4KICA8bGluZSB4MT0iLjU5IiB5MT0iMTIuMjUiIHgyPSIxNS4wNyIgeTI9IjEyLjI1IiBmaWxsPSJub25lIiBzdHJva2U9IiM5Y2U4MjQiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHRleHQgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCA5LjkpIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iU3luZS1FeHRyYUJvbGQsIFN5bmUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtdmFyaWF0aW9uLXNldHRpbmdzPSImYXBvczt3Z2h0JmFwb3M7IDgwMCIgZm9udC13ZWlnaHQ9IjcwMCIgaXNvbGF0aW9uPSJpc29sYXRlIj48dHNwYW4geD0iMCIgeT0iMCI+SHlwZXJzaGU8L3RzcGFuPjx0c3BhbiB4PSI5Mi4wOSIgeT0iMCIgbGV0dGVyLXNwYWNpbmc9Ii0uMDJlbSI+bDwvdHNwYW4+PHRzcGFuIHg9Ijk2LjE3IiB5PSIwIj5mPC90c3Bhbj48L3RleHQ+Cjwvc3ZnPg==";
export const log = (message: string) => {
  console.log(
    `%c                ${message}`,
    `
    background-image: url(${svg});
    background-size: 100px 13px;
    background-repeat: no-repeat;
    background-color: #000;
    background-position: 8px 6px;
    border-radius: 8px;
    padding-bottom: 6px;
    padding-top: 4px;
    padding-left: 10px;
    padding-right: 8px;
    line-height: 1.5;
  `,
  );
};
