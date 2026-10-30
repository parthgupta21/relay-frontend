try {
  var t = localStorage.getItem("relay-theme")
  var dark = t === "dark" || (t !== "light" && matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
} catch {}
