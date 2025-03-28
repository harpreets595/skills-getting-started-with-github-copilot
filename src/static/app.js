document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to show a custom confirmation modal
  function showConfirmationModal(message, onConfirm) {
    const modal = document.createElement("div");
    modal.className = "confirmation-modal";

    modal.innerHTML = `
      <div class="modal-content">
        <p>${message}</p>
        <div class="modal-actions">
          <button class="confirm-btn">Yes</button>
          <button class="cancel-btn">No</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".confirm-btn").addEventListener("click", () => {
      onConfirm();
      document.body.removeChild(modal);
    });

    modal.querySelector(".cancel-btn").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list with delete buttons
        const participantsList = details.participants
          .map(
            (participant) => `
              <li>
                ${participant} 
                <button class="delete-participant" data-activity="${name}" data-email="${participant}">Remove</button>
              </li>
            `
          )
          .join("");

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${participantsList || "<li>No participants yet</li>"}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-participant").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const activity = button.dataset.activity;
          const email = button.dataset.email;

          // Show custom confirmation modal
          showConfirmationModal(`Are you sure you want to remove ${email} from ${activity}?`, async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
                {
                  method: "POST",
                }
              );

              if (response.ok) {
                fetchActivities(); // Refresh activities list
              } else {
                console.error("Failed to remove participant");
              }
            } catch (error) {
              console.error("Error removing participant:", error);
            }
          });
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
