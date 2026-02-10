async function askQuestion() {
    const input = document.getElementById("question");
    const chatBox = document.getElementById("chat-box");
    const question = input.value.trim();

    if (!question) return;

    // show user question
    chatBox.innerHTML += `<div class="user">You: ${question}</div>`;
    input.value = "";

    // call backend
    const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ question })
    });

    const data = await response.json();

    // show bot answer
    chatBox.innerHTML += `<div class="bot">Bot: ${data.answer}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}
