// Minimal i18n helper. Translates the site's own UI chrome (menus, buttons,
// labels, headings, placeholders). Never translate content that comes from
// the database (touch names/descriptions/authors) or the "Touch Library"
// brand name — those are left exactly as stored/typed.

export const LANGUAGE_STORAGE_KEY = "touchLibraryLanguage";

export const translations = {
    en: {
        // Nav / side menu
        nav_library: "Library",
        nav_upload: "Upload",
        nav_play: "Play",
        nav_pattern: "Pattern",
        nav_shape: "Shape",
        login: "Login",
        logout: "Log out",
        authorize_midi: "Authorize Midi Devices",
        language_label: "Language",

        // Library view
        search_by_name: "Search by name...",
        view_cards: "Cards",
        view_graph: "Graph",
        author_prefix: "Author:",
        created_on_prefix: "Created on",
        play: "Play",
        delete: "Delete",
        confirm_delete: "Are you sure you want to delete this file?",
        unnamed_touch: "Unnamed Touch",
        no_description: "No Description",

        // Shared
        save_button: "Save",
        stop_button: "Stop",
        open_button: "Open",
        high_arousal: "High Arousal",
        low_arousal: "Low Arousal",
        pleasure: "Pleasure",
        displeasure: "Displeasure",

        // Upload view
        touch_name_placeholder: "Touch name",
        stop_recording: "Stop Recording",
        start_recording: "Start Recording",
        replay_button: "Replay",
        flow_mode: "Inflate & deflate",
        pressure_mode: "Internal pressure",
        both_mode: "Both overlaid",
        author_label: "Author",
        description_placeholder: "Add a short description here...",
        fill_name_description_alert: "Please fill in the name and description.",
        chart_air_volume_label: "Air in chamber (mL)",
        chart_pressure_label: "Internal pressure (PSI)",
        login_to_save_alert: "Please, log in to save",

        // Playground view
        inflate_button: "Inflate",
        deflate_button: "Deflate",
        fully_deflate_button: "Fully deflate",

        // Pattern generator view
        pattern_name_placeholder: "Pattern name",
        save_pattern_to_db: "Save Pattern to DB",
        enter_pattern_name_alert: "Please enter a pattern name.",
        pattern_saved_alert: "Pattern saved!",
        pattern_save_failed_alert: "Failed to save pattern.",
        pad_header: "Pad",
        action_header: "Action",
        time_header: "Time",
        velocity_header: "Velocity",
        pad_label: "pad",
        action_inflation: "Inflation",
        action_deflation: "Deflation",
        action_holding: "Holding",
        action_full_deflation: "Full deflation",
        time_ms_placeholder: "time in milliseconds",
        add_action_button: "Add Action",
        play_pattern_button: "Play Pattern",

        // Shape editor view
        shape_editor_title: "Shape Editor",
        shape_editor_instructions:
            "Click on the chart to add a point, drag to move it, double-click to remove it. " +
            "\"Play\" converts the curve into inflate/deflate commands and plays it on the real " +
            "peripheral. A stretch faster than the pump can manage (3L/min max) is automatically " +
            "pushed forward in time until the point becomes physically possible.",
        clear_button: "Clear",
        max_volume_label: "Maximum volume (mL)",
        chart_time_axis_label: "Time (s)",
        chart_target_volume_label: "Target volume (mL)",

        // Touch visualization view
        loading_label: "Loading...",
        edit_name_button: "Edit Name",
        save_name_button: "Save Name",
        edit_description_button: "Edit Description",
        save_description_button: "Save Description",
        russell_model_label: "russell circumplex model",
        media_gallery_label: "Media Gallery",
        drag_drop_files_label: "Drag and drop files here or",
        not_author_upload_alert: "You are not the author of this touch and cannot upload files.",
        not_author_edit_name_alert: "You are not the author of this touch and cannot edit the name.",
        not_author_edit_description_alert: "You are not the author of this touch and cannot edit the description.",
        media_alt_label: "Media",
        enlarged_image_alt: "Enlarged",

        // Chart view
        felt_sensation_placeholder: "Describe your felt sensation",

        // Feedback view
        give_feedback_button: "Give Feedback",
        feedback_title: "Give feedback",
        feedback_intro: "Play the touch, then describe what you felt and mark it on the map.",
        feedback_placeholder: "Describe what you felt...",
        submit_feedback_button: "Submit Feedback",
        pick_coordinate_hint: "Click on the map to mark how it felt.",
        feedback_login_required: "Please log in to leave feedback.",
        feedback_thanks: "Thanks for your feedback!",
        feedback_missing_coordinate_alert: "Please click on the map to mark how it felt.",
        feedback_missing_text_alert: "Please describe what you felt.",
    },
    pt: {
        // Nav / side menu
        nav_library: "Biblioteca",
        nav_upload: "Salvar",
        nav_play: "Jogar",
        nav_pattern: "Padrão",
        nav_shape: "Forma",
        login: "Entrar",
        logout: "Sair",
        authorize_midi: "Autorizar Dispositivos MIDI",
        language_label: "Idioma",

        // Library view
        search_by_name: "Buscar por nome...",
        view_cards: "Cartões",
        view_graph: "Gráfico",
        author_prefix: "Autor:",
        created_on_prefix: "Criado em",
        play: "Tocar",
        delete: "Excluir",
        confirm_delete: "Tem certeza que deseja excluir este arquivo?",
        unnamed_touch: "Toque sem nome",
        no_description: "Sem descrição",

        // Shared
        save_button: "Salvar",
        stop_button: "Parar",
        open_button: "Abrir",
        high_arousal: "Alta excitação",
        low_arousal: "Baixa excitação",
        pleasure: "Prazer",
        displeasure: "Desprazer",

        // Upload view
        touch_name_placeholder: "Nome do toque",
        stop_recording: "Parar gravação",
        start_recording: "Iniciar gravação",
        replay_button: "Repetir",
        flow_mode: "Inflar e desinflar",
        pressure_mode: "Pressão interna",
        both_mode: "Ambos sobrepostos",
        author_label: "Autor",
        description_placeholder: "Adicione uma breve descrição aqui...",
        fill_name_description_alert: "Por favor, preencha o nome e a descrição.",
        chart_air_volume_label: "Ar na câmara (mL)",
        chart_pressure_label: "Pressão interna (PSI)",
        login_to_save_alert: "Faça login para salvar",

        // Playground view
        inflate_button: "Inflar",
        deflate_button: "Desinflar",
        fully_deflate_button: "Desinflar totalmente",

        // Pattern generator view
        pattern_name_placeholder: "Nome do padrão",
        save_pattern_to_db: "Salvar padrão no banco de dados",
        enter_pattern_name_alert: "Por favor, digite um nome para o padrão.",
        pattern_saved_alert: "Padrão salvo!",
        pattern_save_failed_alert: "Falha ao salvar o padrão.",
        pad_header: "Pad",
        action_header: "Ação",
        time_header: "Tempo",
        velocity_header: "Velocidade",
        pad_label: "pad",
        action_inflation: "Inflação",
        action_deflation: "Deflação",
        action_holding: "Retenção",
        action_full_deflation: "Deflação total",
        time_ms_placeholder: "tempo em milissegundos",
        add_action_button: "Adicionar ação",
        play_pattern_button: "Tocar padrão",

        // Shape editor view
        shape_editor_title: "Editor de forma",
        shape_editor_instructions:
            'Clique no gráfico para adicionar um ponto, arraste para mover, dê duplo-clique ' +
            'para remover. "Play" converte a curva em comandos de inflar/desinflar e toca no ' +
            'periférico de verdade. Um trecho mais rápido do que a bomba consegue (3L/min no ' +
            'máximo) é automaticamente empurrado no tempo até o ponto ficar fisicamente possível.',
        clear_button: "Limpar",
        max_volume_label: "Volume máximo (mL)",
        chart_time_axis_label: "Tempo (s)",
        chart_target_volume_label: "Volume alvo (mL)",

        // Touch visualization view
        loading_label: "Carregando...",
        edit_name_button: "Editar nome",
        save_name_button: "Salvar nome",
        edit_description_button: "Editar descrição",
        save_description_button: "Salvar descrição",
        russell_model_label: "modelo circumplexo de Russell",
        media_gallery_label: "Galeria de mídia",
        drag_drop_files_label: "Arraste e solte arquivos aqui ou",
        not_author_upload_alert: "Você não é o autor deste toque e não pode enviar arquivos.",
        not_author_edit_name_alert: "Você não é o autor deste toque e não pode editar o nome.",
        not_author_edit_description_alert: "Você não é o autor deste toque e não pode editar a descrição.",
        media_alt_label: "Mídia",
        enlarged_image_alt: "Ampliada",

        // Chart view
        felt_sensation_placeholder: "Descreva a sensação sentida",

        // Feedback view
        give_feedback_button: "Dar Feedback",
        feedback_title: "Dar feedback",
        feedback_intro: "Toque o toque, depois descreva o que sentiu e marque no mapa.",
        feedback_placeholder: "Descreva o que você sentiu...",
        submit_feedback_button: "Enviar Feedback",
        pick_coordinate_hint: "Clique no mapa para marcar como você se sentiu.",
        feedback_login_required: "Faça login para deixar um feedback.",
        feedback_thanks: "Obrigado pelo seu feedback!",
        feedback_missing_coordinate_alert: "Clique no mapa para marcar como você se sentiu.",
        feedback_missing_text_alert: "Descreva o que você sentiu.",
    },
};

export function t(key, language) {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
}
