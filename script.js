// =============================
// OrbitPay Mobile Menu
// =============================

document.addEventListener("DOMContentLoaded", () => {

    const menuToggle = document.getElementById("menu-toggle");
    const navbar = document.getElementById("navbar");

    if (!menuToggle || !navbar) return;

    menuToggle.addEventListener("click", () => {

        navbar.classList.toggle("active");

        if (navbar.classList.contains("active")) {

            menuToggle.innerHTML = "✕";

        } else {

            menuToggle.innerHTML = "☰";

        }

    });

});

// =============================
// OrbitPay Contact Form
// =============================

const contactForm = document.getElementById("contact-form");

if (contactForm) {

    contactForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const formData = new FormData(contactForm);

        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            subject: formData.get("subject"),
            department: formData.get("department"),
            message: formData.get("message")
        };

        try {

            const response = await fetch("http://localhost:3005/api/contact", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.status === "success") {

                alert("Your message has been sent successfully!");

                contactForm.reset();

            } else {

                alert(result.message);

            }

        } catch (error) {

            console.error("Contact form error:", error);

            alert("Unable to send your message. Please try again.");

        }

    });

}