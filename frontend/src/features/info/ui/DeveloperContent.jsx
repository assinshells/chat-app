import { Heart } from "lucide-react";

/**
 * DeveloperContent — розділ "Розробники" (Налаштування → Допомога).
 */
export function DeveloperContent() {
  return (
    <p className="mb-0 py-4 text-center">
      Programmed by{" "}
      <Heart
        className="text-danger footer-icon"
        size="1em"
        fill="currentColor"
      />{" "}
      E.Thompson.
    </p>
  );
}
