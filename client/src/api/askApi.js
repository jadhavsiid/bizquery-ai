const api = import.meta.env.VITE_API_BASE_URL;

export async function askQuestion(question) {
  const res = await fetch(`${api}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  return res.json();
}
