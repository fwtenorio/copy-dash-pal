import * as React from "react";
import PhoneInputWithCountry from "react-phone-number-input/input";
import { cn } from "@/lib/utils";
import { CountryCodeSelector, findCountryByDialCode } from "@/components/CountryCodeSelector";

type E164Number = string;

interface PhoneInputProps {
  value?: E164Number;
  onChange?: (value: E164Number | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, placeholder = "555 123 4567", disabled, ...props }, ref) => {
    const [country, setCountry] = React.useState<string>("BR");

    // Detectar país baseado no valor inicial
    React.useEffect(() => {
      if (value) {
        const detectedCountry = findCountryByDialCode(value);
        if (detectedCountry) {
          setCountry(detectedCountry.code);
        }
      }
    }, [value]);

    return (
      <div className="flex gap-2 w-full">
        {/* Seletor de País com Bandeira - CountryCodeSelector Original */}
        <CountryCodeSelector
          value={country}
          onValueChange={(code, dialCode) => {
            setCountry(code);
            // Limpar o número quando mudar de país
            onChange?.(undefined);
          }}
        />

        {/* Input de Telefone com Formatação Automática */}
        <PhoneInputWithCountry
          ref={ref}
          country={country as any}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-md border border-[#DEDEDE] bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#19976F] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
