export function SiteFooter() {
  return (
    <footer
      className="border-t border-border"
      style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#9f988a" }}
    >
      <div style={{ padding: "30px clamp(20px,4vw,56px) 50px" }}>
        © 2026{" "}
        <b className="text-brand" style={{ fontWeight: 400 }}>
          Player &amp; Movie Mix
        </b>
      </div>
    </footer>
  );
}
