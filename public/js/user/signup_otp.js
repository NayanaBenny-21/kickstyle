console.log("OTP JS loaded");

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault(); // 🚨 THIS FIXES EVERYTHING

   const formData = new URLSearchParams(new FormData(form));

        try {
            const res = await fetch("/auth/signup/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData
            });
        const data = await res.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: data.message,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = data.redirect;
            });

        } else {
            Swal.fire({
                icon: "error",
                title: data.message
            });
        }

    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: "error",
            title: "Something went wrong"
        });
    }
});

    const resend = document.getElementById("resend");
    const timerElement = document.getElementById("timer");

    let countdown = parseInt(window.remainingTime) || 0;
    let interval;

    function showToast(icon, text) {
        return Swal.fire({
            icon,
            text,
            toast: true,
            position: "bottom",
            timer: 2500,
            showConfirmButton: false,
            width: 350,
            padding: '0.5em 1em',
            customClass: { popup: 'small-toast' }
        });
    }

    function startTimer() {
        if (interval) clearInterval(interval);

        if (countdown <= 0) {
            timerElement.style.display = "none";
            resend.style.display = "inline-block";
            resend.disabled = false;
            return;
        }

        resend.style.display = "none";
        resend.disabled = true;
        timerElement.style.display = "inline";

        interval = setInterval(() => {
            const minutes = Math.floor(countdown / 60);
            const seconds = countdown % 60;
            timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds} left`;
            countdown--;

            if (countdown <= 0) {
                clearInterval(interval);
                timerElement.textContent = "";
                timerElement.style.display = "none";
                resend.style.display = "inline-block";
                resend.disabled = false;
            }
        }, 1000);
    }
// ✅ ONLY START TIMER IF OTP NOT EXPIRED
if (window.otpSent && !window.otpExpired && countdown > 0) {

    if (!sessionStorage.getItem("otpInitialToast")) {
        showToast("success", "OTP sent to your email");
        sessionStorage.setItem("otpInitialToast", "true");
    }

    startTimer();

} else {

    // OTP expired → keep resend visible
    if (interval) clearInterval(interval);
    timerElement.style.display = "none";
    resend.style.display = "inline-block";
    resend.disabled = false;
}

    // 🔁 RESEND OTP
    resend.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/auth/signup/resend-otp", { method: "POST" });
            const data = await res.json();

            if (data.success) {
                showToast("success", "OTP resent successfully");

                countdown = 60; // reset timer
                startTimer();
            } 
            else {
                showToast("error", data.message || "Failed to resend OTP");
                if (data.redirect) window.location.href = data.redirect;
            }

        } catch (err) {
            console.error(err);
            showToast("error", "Something went wrong");
        }
    });

    // OTP INPUT AUTO MOVE
    const inputs = document.querySelectorAll(".otp-input");

    inputs.forEach(input => {
        input.addEventListener("input", e => {
            if (isNaN(e.target.value)) e.target.value = '';
            else if (e.target.nextElementSibling && e.target.value !== '')
                e.target.nextElementSibling.focus();
        });

        input.addEventListener("keydown", e => {
            if (e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                if (input.value !== '') {
                    input.value = '';
                } 
                else if (input.previousElementSibling) {
                    input.previousElementSibling.value = '';
                    input.previousElementSibling.focus();
                }
            }
        });
    });

});
