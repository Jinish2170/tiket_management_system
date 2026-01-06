const axios = require("axios");

const BASE_URL = "http://localhost:3000";
let authToken = "";
let userId = 0;
let ticketId = 0;
let commentId = 0;
let tagId = 0;

// Test results
const results = {
  passed: [],
  failed: [],
};

function logTest(name, status, details = "") {
  const symbol = status === "PASS" ? "✅" : "❌";
  console.log(`${symbol} ${name}`);
  if (details) console.log(`   ${details}`);

  if (status === "PASS") {
    results.passed.push(name);
  } else {
    results.failed.push({ name, details });
  }
}

async function test() {
  console.log("\n🔍 BACKEND API ENDPOINT TESTING\n");
  console.log("=".repeat(60));

  // 1. Register User
  try {
    console.log("\n📝 AUTHENTICATION ENDPOINTS");
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    authToken = registerRes.data.token;
    userId = registerRes.data.user.id;
    logTest(
      "POST /auth/register",
      "PASS",
      `User ID: ${userId}, Token received: ${authToken.substring(0, 20)}...`
    );
  } catch (err) {
    logTest(
      "POST /auth/register",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // 2. Login User
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });
    logTest(
      "POST /auth/login",
      "PASS",
      `Token: ${loginRes.data.token.substring(0, 20)}...`
    );
  } catch (err) {
    logTest(
      "POST /auth/login",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // Set auth header for subsequent requests
  const config = {
    headers: { Authorization: `Bearer ${authToken}` },
  };

  // 3. Create Ticket
  try {
    console.log("\n🎫 TICKET ENDPOINTS");
    const ticketRes = await axios.post(
      `${BASE_URL}/tickets`,
      {
        title: "Test Ticket",
        description: "This is a test ticket",
        priority: "high",
      },
      config
    );
    ticketId = ticketRes.data.id;
    logTest(
      "POST /tickets",
      "PASS",
      `Ticket ID: ${ticketId}, reporterId: ${ticketRes.data.reporterId}`
    );
  } catch (err) {
    logTest("POST /tickets", "FAIL", err.response?.data?.error || err.message);
  }

  // 4. Get All Tickets
  try {
    const ticketsRes = await axios.get(`${BASE_URL}/tickets`, config);
    logTest(
      "GET /tickets",
      "PASS",
      `Retrieved ${ticketsRes.data.tickets.length} tickets, Total: ${ticketsRes.data.total}`
    );
  } catch (err) {
    logTest("GET /tickets", "FAIL", err.response?.data?.error || err.message);
  }

  // 5. Get Single Ticket
  try {
    const ticketRes = await axios.get(
      `${BASE_URL}/tickets/${ticketId}`,
      config
    );
    logTest(
      "GET /tickets/:id",
      "PASS",
      `Title: ${ticketRes.data.title}, Status: ${ticketRes.data.status}, Priority: ${ticketRes.data.priority}`
    );
  } catch (err) {
    logTest(
      "GET /tickets/:id",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // 6. Update Ticket
  try {
    const updateRes = await axios.put(
      `${BASE_URL}/tickets/${ticketId}`,
      {
        status: "in_progress",
        priority: "medium",
      },
      config
    );
    logTest(
      "PUT /tickets/:id",
      "PASS",
      `New status: ${updateRes.data.status}, New priority: ${updateRes.data.priority}`
    );
  } catch (err) {
    logTest(
      "PUT /tickets/:id",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // 7. Create Comment
  try {
    console.log("\n💬 COMMENT ENDPOINTS");
    const commentRes = await axios.post(
      `${BASE_URL}/comments`,
      {
        ticketId: ticketId,
        body: "This is a test comment",
      },
      config
    );
    commentId = commentRes.data.id;
    logTest("POST /comments", "PASS", `Comment ID: ${commentId}`);
  } catch (err) {
    logTest("POST /comments", "FAIL", err.response?.data?.error || err.message);
  }

  // 8. Get Comments for Ticket
  try {
    const commentsRes = await axios.get(
      `${BASE_URL}/comments/${ticketId}`,
      config
    );
    logTest(
      "GET /comments/:ticketId",
      "PASS",
      `Retrieved ${commentsRes.data.length} comments`
    );
  } catch (err) {
    logTest(
      "GET /comments/:ticketId",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // 9. Update Comment
  try {
    const updateCommentRes = await axios.put(
      `${BASE_URL}/comments/${commentId}`,
      { body: "Updated comment text" },
      config
    );
    logTest(
      "PUT /comments/:id",
      "PASS",
      `Updated: ${updateCommentRes.data.body}`
    );
  } catch (err) {
    logTest(
      "PUT /comments/:id",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // 10. Get Activity Logs
  try {
    console.log("\n📊 ACTIVITY ENDPOINTS");
    const activityRes = await axios.get(
      `${BASE_URL}/activity/${ticketId}`,
      config
    );
    logTest(
      "GET /activity/:ticketId",
      "PASS",
      `Retrieved ${activityRes.data.length} activity logs`
    );
  } catch (err) {
    logTest(
      "GET /activity/:ticketId",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // 11. Create Tag (requires admin - will fail with role check)
  try {
    console.log("\n🏷️  TAG ENDPOINTS");
    const tagRes = await axios.post(
      `${BASE_URL}/tags`,
      { name: "bug" },
      config
    );
    tagId = tagRes.data.id;
    logTest("POST /tags (admin)", "PASS", `Tag ID: ${tagId}`);
  } catch (err) {
    if (err.response?.status === 403) {
      logTest(
        "POST /tags (admin)",
        "EXPECTED",
        "Forbidden - user is not admin (correct behavior)"
      );
    } else {
      logTest(
        "POST /tags (admin)",
        "FAIL",
        err.response?.data?.error || err.message
      );
    }
  }

  // 12. Get All Tags
  try {
    const tagsRes = await axios.get(`${BASE_URL}/tags`, config);
    logTest("GET /tags", "PASS", `Retrieved ${tagsRes.data.length} tags`);
  } catch (err) {
    logTest("GET /tags", "FAIL", err.response?.data?.error || err.message);
  }

  // 13. Delete Comment
  try {
    await axios.delete(`${BASE_URL}/comments/${commentId}`, config);
    logTest("DELETE /comments/:id", "PASS", `Comment ${commentId} deleted`);
  } catch (err) {
    logTest(
      "DELETE /comments/:id",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // 14. Delete Ticket
  try {
    await axios.delete(`${BASE_URL}/tickets/${ticketId}`, config);
    logTest("DELETE /tickets/:id", "PASS", `Ticket ${ticketId} deleted`);
  } catch (err) {
    logTest(
      "DELETE /tickets/:id",
      "FAIL",
      err.response?.data?.error || err.message
    );
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📋 TEST SUMMARY");
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log("\nFailed Tests:");
    results.failed.forEach((f) => console.log(`  - ${f.name}: ${f.details}`));
  }

  console.log("\n" + "=".repeat(60));
  process.exit(results.failed.length > 0 ? 1 : 0);
}

test();
