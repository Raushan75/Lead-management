export default function Footer() {
  return (
    <footer className="border-t bg-background/60 backdrop-blur py-6 mt-auto">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} LeadHub. All rights reserved.</p>
        <a
          href="https://digitalheroesco.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground hover:text-primary transition-colors"
        >
          Built for Digital Heroes Training Task →
        </a>
      </div>
    </footer>
  );
}
