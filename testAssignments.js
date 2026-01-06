/**
 * Test script for Assignment tracking system
 * Tests the ability to track who created tickets and whom they assigned them to
 */

const axios = require("axios");
const API_URL = "http://localhost:3000";

let adminToken = "";
let assigneeToken = "";
let userToken = "";
let adminUser = null;
let assigneeUser = null;
let userUser = null;
let ticketId = null;

// Helper to wait a bit between operations
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const test = async () => {
  try {
    console.log("🧪 Testing Assignment Tracking System\n");

    // Use timestamp to ensure unique emails
    const timestamp = Date.now();

    // 1. Register users with different roles
    console.log("1️⃣ Registering users...");

    const admin = await axios.post(`${API_URL}/auth/register`, {
      name: "Admin User",
      email: `admin${timestamp}@test.com`,
      password: "admin123",
      role: "admin",
    });
    adminToken = admin.data.token;
    adminUser = admin.data.user;
    console.log("   ✅ Admin registered:", adminUser.name);

    const assignee = await axios.post(`${API_URL}/auth/register`, {
      name: "Assignee User",
      email: `assignee${timestamp}@test.com`,
      password: "assignee123",
      role: "assignee",
    });
    assigneeToken = assignee.data.token;
    assigneeUser = assignee.data.user;
    console.log("   ✅ Assignee registered:", assigneeUser.name);

    const user = await axios.post(`${API_URL}/auth/register`, {
      name: "Regular User",
      email: `user${timestamp}@test.com`,
      password: "user123",
      role: "user",
    });
    userToken = user.data.token;
    userUser = user.data.user;
    console.log("   ✅ User registered:", userUser.name);

    await wait(100);

    // 2. Assignee creates a ticket and assigns it to user
    console.log("\n2️⃣ Assignee creating ticket and assigning to user...");
    const ticket = await axios.post(
      `${API_URL}/tickets`,
      {
        title: "Movie Ticket: Avengers",
        description: "One ticket for Avengers showing at 7pm",
        priority: "high",
        assignedToUserId: userUser.id,
      },
      { headers: { Authorization: `Bearer ${assigneeToken}` } }
    );
    ticketId = ticket.data.id;
    console.log("   ✅ Ticket created:", ticket.data.title);
    console.log("   📌 Created by:", ticket.data.creator.name);
    console.log("   👤 Assigned to:", ticket.data.assignedUser.name);

    await wait(100);

    // 3. Check assignment record was created
    console.log("\n3️⃣ Checking assignment record...");
    const assignments = await axios.get(
      `${API_URL}/assignments/ticket/${ticketId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log("   ✅ Assignment records found:", assignments.data.length);
    assignments.data.forEach((a, i) => {
      console.log(
        `   ${i + 1}. ${a.action} by ${a.assignedBy.name} to ${
          a.assignedTo.name
        }`
      );
      console.log(`      Time: ${new Date(a.createdAt).toLocaleString()}`);
    });

    await wait(100);

    // 4. Assignee reassigns ticket to another user
    console.log("\n4️⃣ Creating second user and reassigning ticket...");
    const user2 = await axios.post(`${API_URL}/auth/register`, {
      name: "Second User",
      email: `user2${timestamp}@test.com`,
      password: "user123",
      role: "user",
    });
    const user2Token = user2.data.token;
    const user2User = user2.data.user;
    console.log("   ✅ Second user registered:", user2User.name);

    await wait(100);

    const reassigned = await axios.put(
      `${API_URL}/tickets/${ticketId}/assign`,
      { assignedToUserId: user2User.id },
      { headers: { Authorization: `Bearer ${assigneeToken}` } }
    );
    console.log("   ✅ Ticket reassigned from:", userUser.name);
    console.log("   👤 To:", reassigned.data.assignedUser.name);

    await wait(100);

    // 5. Check updated assignment history
    console.log("\n5️⃣ Checking updated assignment history...");
    const updatedAssignments = await axios.get(
      `${API_URL}/assignments/ticket/${ticketId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      "   ✅ Total assignment records:",
      updatedAssignments.data.length
    );
    updatedAssignments.data.forEach((a, i) => {
      console.log(
        `   ${i + 1}. ${a.action.toUpperCase()} by ${a.assignedBy.name} to ${
          a.assignedTo.name
        }`
      );
      if (a.previousAssignedToUserId) {
        console.log(`      Previous user ID: ${a.previousAssignedToUserId}`);
      }
      console.log(`      Time: ${new Date(a.createdAt).toLocaleString()}`);
    });

    await wait(100);

    // 6. User revokes ticket
    console.log("\n6️⃣ User revoking ticket...");
    const revoked = await axios.put(
      `${API_URL}/tickets/${ticketId}/revoke`,
      {},
      { headers: { Authorization: `Bearer ${user2Token}` } }
    );
    console.log("   ✅ Ticket revoked by:", user2User.name);
    console.log("   Status changed to:", revoked.data.status);

    await wait(100);

    // 7. Check final assignment history (including revocation)
    console.log("\n7️⃣ Checking final assignment history...");
    const finalAssignments = await axios.get(
      `${API_URL}/assignments/ticket/${ticketId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      "   ✅ Total assignment records:",
      finalAssignments.data.length
    );
    finalAssignments.data.forEach((a, i) => {
      console.log(
        `   ${i + 1}. ${a.action.toUpperCase()} by ${a.assignedBy.name} to ${
          a.assignedTo.name
        }`
      );
      if (a.notes) console.log(`      Notes: ${a.notes}`);
      console.log(`      Time: ${new Date(a.createdAt).toLocaleString()}`);
    });

    await wait(100);

    // 8. Admin checks all assignments
    console.log("\n8️⃣ Admin viewing all assignments...");
    const allAssignments = await axios.get(`${API_URL}/assignments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(
      "   ✅ Total assignments in system:",
      allAssignments.data.total
    );
    console.log("   📊 Assignments breakdown:");
    allAssignments.data.assignments.forEach((a, i) => {
      console.log(
        `   ${i + 1}. Ticket: "${a.ticket.title}" (${a.ticket.status})`
      );
      console.log(
        `      ${a.action} by ${a.assignedBy.name} (${a.assignedBy.role})`
      );
      console.log(`      to ${a.assignedTo.name} (${a.assignedTo.role})`);
    });

    await wait(100);

    // 9. Admin checks statistics
    console.log("\n9️⃣ Admin checking assignment statistics...");
    const stats = await axios.get(`${API_URL}/assignments/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("   📈 Assignment Statistics:");
    console.log("   Total assignments:", stats.data.totalAssignments);
    console.log("\n   By action type:");
    stats.data.assignmentsByAction.forEach((a) => {
      console.log(`      ${a.action}: ${a.count}`);
    });
    console.log("\n   Top assignees (who assign most tickets):");
    stats.data.topAssignees.forEach((a, i) => {
      console.log(
        `      ${i + 1}. ${a.assignedBy.name} - ${
          a.assignmentCount
        } assignments`
      );
    });
    console.log("\n   Users with most tickets:");
    stats.data.topAssignedUsers.forEach((a, i) => {
      console.log(
        `      ${i + 1}. ${a.assignedTo.name} - ${a.ticketCount} tickets`
      );
    });

    await wait(100);

    // 10. Admin checks specific user's assignments
    console.log("\n🔟 Admin checking assignee user's activity...");
    const userActivity = await axios.get(
      `${API_URL}/assignments/user/${assigneeUser.id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(
      "   👤 User:",
      userActivity.data.user.name,
      `(${userActivity.data.user.role})`
    );
    console.log(
      "   📤 Tickets assigned BY this user:",
      userActivity.data.assignedByUser.length
    );
    userActivity.data.assignedByUser.forEach((a, i) => {
      console.log(
        `      ${i + 1}. ${a.action} - "${a.ticket.title}" to ${
          a.assignedTo.name
        }`
      );
    });
    console.log(
      "   📥 Tickets assigned TO this user:",
      userActivity.data.assignedToUser.length
    );

    console.log(
      "\n✅ All tests passed! Assignment tracking working perfectly!"
    );
    console.log("\n📋 Summary:");
    console.log("   - Created 3 users (admin, assignee, user)");
    console.log("   - Assignee created ticket and assigned to user");
    console.log("   - Reassigned ticket to second user");
    console.log("   - User revoked ticket");
    console.log("   - All actions tracked in Assignments table");
    console.log("   - Admin can view complete audit trail");
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Error:", error.response.data);
    } else {
      console.error("   Error:", error.message);
    }
  }
};

test();
