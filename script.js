// Replace with your API key (keep safe – ideally use backend proxy for production!)
const OPENAI_API_KEY = "YOUR_API_KEY_HERE";

const upload = document.getElementById("upload");
const uploadedImg = document.getElementById("uploadedImg");
const enhanceBtn = document.getElementById("enhanceBtn");
const enhancedImg = document.getElementById("enhancedImg");
const downloadLink = document.getElementById("downloadLink");

let uploadedFile;

// Show preview after upload
upload.addEventListener("change", (e) => {
  uploadedFile = e.target.files[0];
  if (uploadedFile) {
    uploadedImg.src = URL.createObjectURL(uploadedFile);
    uploadedImg.style.display = "block";
    enhanceBtn.style.display = "inline-block";
  }
});

// Send image to AI API
enhanceBtn.addEventListener("click", async () => {
  if (!uploadedFile) return alert("Please upload an image first!");

  enhanceBtn.innerText = "Enhancing...";
  enhanceBtn.disabled = true;

  const formData = new FormData();
  formData.append("image", uploadedFile);
  formData.append("prompt", "Enhance photo, sharpen, upscale like Remini.");

  try {
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const enhancedUrl = data.data[0].url;
    enhancedImg.src = enhancedUrl;
    enhancedImg.style.display = "block";
    
    downloadLink.href = enhancedUrl;
    downloadLink.style.display = "inline-block";

  } catch (err) {
    alert("Error: " + err.message);
  } finally {
    enhanceBtn.innerText = "Enhance Image";
    enhanceBtn.disabled = false;
  }
});
