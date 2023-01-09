var request = require("request");
var options = {
  method: "PATCH",
  url: "http://38.242.237.75:3001/events/94/single-event",
  headers: {
    Authorization:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInVzZXJSb2xlIjoibWVtYmVyIiwiaWF0IjoxNjczMjY5NzY0LCJleHAiOjY3MzY3MzIwMjU2NH0.rcOvCE1YRr6zFRZYlbdDmgap-HQxEjaO3LXuNUQlrUI",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "sddfsfdsasa321dasfassa0",
    startDate: "2023-01-09T18:00:00.000Z",
    endDate: "2023-01-09T19:00:00.000Z",
    status: "waiting_for_confirmation",
  }),
};
for (let i = 0; i < 300; i++) {
  request(options, function (error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
  });
}
