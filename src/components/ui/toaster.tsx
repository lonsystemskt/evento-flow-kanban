
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  // Traduções para mensagens comuns
  const translateTitle = (title: string | undefined) => {
    if (!title) return "";
    
    const translations: Record<string, string> = {
      'Success': 'Sucesso',
      'Error': 'Erro',
      'Warning': 'Aviso',
      'Info': 'Informação'
    };
    return translations[title] || title;
  };

  const translateDescription = (description: string | undefined) => {
    if (!description) return "";
    
    const translations: Record<string, string> = {
      'Event created successfully': 'Evento criado com sucesso',
      'Event updated successfully': 'Evento atualizado com sucesso',
      'Event archived successfully': 'Evento arquivado com sucesso',
      'Event restored successfully': 'Evento restaurado com sucesso',
      'Event deleted successfully': 'Evento excluído com sucesso',
      'Failed to create event. Please try again.': 'Falha ao criar evento. Por favor, tente novamente.',
      'Failed to update event. Please try again.': 'Falha ao atualizar evento. Por favor, tente novamente.',
      'Failed to archive event. Please try again.': 'Falha ao arquivar evento. Por favor, tente novamente.',
      'Failed to restore event. Please try again.': 'Falha ao restaurar evento. Por favor, tente novamente.',
      'Failed to delete event. Please try again.': 'Falha ao excluir evento. Por favor, tente novamente.',
      'Demand added successfully': 'Demanda adicionada com sucesso',
      'Demand updated successfully': 'Demanda atualizada com sucesso',
      'Demand deleted successfully': 'Demanda excluída com sucesso',
      'Failed to add demand. Please try again.': 'Falha ao adicionar demanda. Por favor, tente novamente.',
      'Failed to update demand. Please try again.': 'Falha ao atualizar demanda. Por favor, tente novamente.',
      'Failed to delete demand. Please try again.': 'Falha ao excluir demanda. Por favor, tente novamente.',
      'CRM record added successfully': 'Registro CRM adicionado com sucesso',
      'CRM record updated successfully': 'Registro CRM atualizado com sucesso',
      'CRM record deleted successfully': 'Registro CRM excluído com sucesso',
      'Failed to add CRM record. Please try again.': 'Falha ao adicionar registro CRM. Por favor, tente novamente.',
      'Failed to update CRM record. Please try again.': 'Falha ao atualizar registro CRM. Por favor, tente novamente.',
      'Failed to delete CRM record. Please try again.': 'Falha ao excluir registro CRM. Por favor, tente novamente.',
      'Note added successfully': 'Anotação adicionada com sucesso',
      'Note updated successfully': 'Anotação atualizada com sucesso',
      'Note deleted successfully': 'Anotação excluída com sucesso',
      'Failed to add note. Please try again.': 'Falha ao adicionar anotação. Por favor, tente novamente.',
      'Failed to update note. Please try again.': 'Falha ao atualizar anotação. Por favor, tente novamente.',
      'Failed to delete note. Please try again.': 'Falha ao excluir anotação. Por favor, tente novamente.',
      'Failed to load data. Please try again.': 'Falha ao carregar dados. Por favor, tente novamente.'
    };
    return translations[description] || description;
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{translateTitle(title.toString())}</ToastTitle>}
              {description && (
                <ToastDescription>{translateDescription(description.toString())}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
