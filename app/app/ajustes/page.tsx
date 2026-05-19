import { SettingsForm } from "@/components/dashboard/SettingsForm";

export default function AjustesPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Ajustes</h1>
        <p className="mt-2 text-stone-500">
          Perfil do restaurante e parâmetros de delivery.
        </p>
      </header>
      <SettingsForm />
    </div>
  );
}
