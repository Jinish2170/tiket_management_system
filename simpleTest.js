const axios = require("axios");

async function simpleTest() {
  try {
    console.log("Testing server connection...");
    const response = await axios.post("http://localhost:3000/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "test123",
      role: "user",
    });
    console.log("Success:", response.data);
  } catch (error) {
    console.log("Error details:");
    console.log("Message:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    } else if (error.request) {
      console.log("No response received");
      console.log("Request:", error.request);
    }
  }
}

simpleTest();
