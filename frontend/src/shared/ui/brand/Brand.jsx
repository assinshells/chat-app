import brandImage from "@shared/assets/logo/brand.png";

/**
 * Brand — логотип бренду. Винесено окремо, щоб підключати на будь-якій
 * сторінці (логін, реєстрація, відновлення пароля тощо) без дублювання.
 *
 * className — додаткові класи/відступи (напр. "mb-5");
 * style — перевизначення розміру (за замовчуванням ширина .brand-link).
 */
export function Brand({ href = "/", className = "", style, alt = "brand" }) {
  return (
    <a href={href} className={`d-inline-block brand-link ${className}`.trim()} style={style}>
      <img src={brandImage} alt={alt} className="w-100" />
    </a>
  );
}
