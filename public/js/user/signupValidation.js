document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirmPassword");

  const nameError = document.getElementById("nameError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const confirmError = document.getElementById("confirmError");
  
  const nameRegex = /^[A-Za-z\s]+$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;

  nameInput.addEventListener("input", () => {
    const name = nameInput.value.trim();
    if (!name) {
        nameError.textContent = 'Please enter your name';
    }else if (!nameRegex.test(name)) {
        nameError.textContent = 'Name should contain only alphabets';
    } else {
        nameError.textContent ='';
    }
  });

emailInput.addEventListener("input", () => {
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    emailError.textContent = "Please enter your email";
  } 
  else if (!emailRegex.test(email)) {
    emailError.textContent = "Invalid email address";
  } 
  else {
    emailError.textContent = "";
  }
});

passwordInput.addEventListener("input", () => {
  const password = passwordInput.value; 
  if (password.length === 0) {
    passwordError.textContent = "Please fill the password field.";
  } 
  else if (!passwordRegex.test(password)) {
    passwordError.textContent =
      "Password must be 8–12 characters and include at least one letter, one number, and one special character.";
  } 
  else {
    passwordError.textContent = "";
  }
});

  //form submit validation

form.addEventListener("submit", (e) => {
  let valid = true;

  const password = passwordInput.value.trim();
  const confirmPassword = confirmInput.value.trim();

  // Clear old errors
  confirmError.textContent = "";

  // Confirm password validation (ONLY here)
  if (!confirmPassword) {
    confirmError.textContent = "Please confirm your password.";
    valid = false;
  } 
  else if (password !== confirmPassword) {
    confirmError.textContent = "Passwords do not match.";
        passwordInput.value = "";
    confirmInput.value = "";
    valid = false;
  }

  if (!valid) {
    e.preventDefault();
  }
});

});