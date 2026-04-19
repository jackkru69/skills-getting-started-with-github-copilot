document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const defaultActivityOption =
    '<option value="">-- Select an activity --</option>';
  let messageTimeoutId;
  const showMessage = (text, type) => {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    if (messageTimeoutId) {
      clearTimeout(messageTimeoutId);
    }
    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  };
  const renderParticipants = (activityName, participants) =>
    participants.length
      ? `<div class="participants-section"><p class="participants-title">Participants</p><ul class="participants-list">${participants.map((participant) => `<li><span class="participant-email">${participant}</span><button type="button" class="participant-remove-button" data-activity="${encodeURIComponent(activityName)}" data-email="${encodeURIComponent(participant)}" aria-label="Remove ${participant} from ${activityName}" title="Remove participant">✕</button></li>`).join("")}</ul></div>`
      : `<div class="participants-section participants-empty"><p class="participants-title">Participants</p><p class="participants-empty-text">No one has signed up yet — be the first star of the show.</p></div>`;
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`, {
        cache: "no-store",
      });
      const activities = await response.json();
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = defaultActivityOption;
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft =
          details.max_participants - details.participants.length;
        const participants = details.participants || [];
        activityCard.innerHTML = `<h4>${name}</h4><p>${details.description}</p><p><strong>Schedule:</strong> ${details.schedule}</p><p><strong>Availability:</strong> ${spotsLeft} spots left</p>${renderParticipants(name, participants)}`;
        activitiesList.appendChild(activityCard);
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }
  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove-button");
    if (!removeButton) {
      return;
    }
    const activity = decodeURIComponent(removeButton.dataset.activity || "");
    const email = decodeURIComponent(removeButton.dataset.email || "");
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Could not remove participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  });
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" },
      );
      const result = await response.json();
      if (response.ok) {
        signupForm.reset();
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });
  fetchActivities();
});
