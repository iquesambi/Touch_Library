// Minimal i18n helper. Translates the site's own UI chrome (menus, buttons,
// labels, headings, placeholders). Never translate content that comes from
// the database (touch names/descriptions/authors) or the "Touch Library"
// brand name — those are left exactly as stored/typed.

export const LANGUAGE_STORAGE_KEY = "touchLibraryLanguage";

export const translations = {
    en: {
        // Nav / side menu
        nav_library: "Library",
        nav_upload: "Record touch",
        nav_play: "Play",
        nav_pattern: "Pattern",
        nav_shape: "Shape editor",
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

        // --- Redesign ---
        // Nav / side menu
        nav_test: "Test a touch",

        // Library
        no_touches_found: "No touches match your search.",

        // Record a touch (step 1)
        record_a_touch_title: "Record a touch",
        next_step: "Next step",
        touch_name_label: "Touch name",
        description_label: "Description",
        air_in_chamber: "Air in chamber (mL)",

        // Shape editor
        shape_name_label: "Shape name",
        shape_name_placeholder: "Shape name",
        shape_saved_alert: "Shape saved.",
        shape_save_failed_alert: "Could not save the shape.",

        // Test a touch
        test_a_touch_title: "Test a touch",
        select_a_touch: "Select a touch",
        play_touch: "Play touch",
        your_name_placeholder: "Your name",
        save_test_data: "Save test data",
        enter_your_name_alert: "Please enter your name before saving the test data.",

        // Touch detail
        back_to_library: "Back to library",
        mood_panel_label: "Mood · Russell circumplex",
        media_panel_label: "Media",

        // Media (step 3)
        media_step_title: "Add media",
        media_step_intro: "Add reference photos or videos of this touch\u2019s physical setup.",
        finish: "Finish",

        // --- Create an entry (merged record + shape flow) ---
        nav_create_entry: "Create a entry",
        connect_kit: "Connect kit",
        create_entry_title: "Create a entry",
        capture_from_kit: "Capture from kit",
        draw_shape: "Draw shape",
        save_touch: "Save touch",
        saving_label: "Saving…",
        mood_step_intro: "Click inside the square to mark how this touch feels on the pleasure/arousal map.",
        felt_sensation_label: "Felt sensation",
        draw_a_shape_alert: "Draw a shape before saving.",
        record_something_alert: "Record or draw a touch before saving.",
        save_touch_failed_alert: "Could not save this touch. Please try again.",
        remove: "Remove",
        close: "Close",
        previous: "Previous",
        next: "Next",
        feedback_prompt_note: "Felt something different? Let the research team know how this touch compared to its intended sensation.",
    },
    pt: {
        // Nav / side menu
        nav_library: "Biblioteca",
        nav_upload: "Gravar toque",
        nav_play: "Jogar",
        nav_pattern: "Padrão",
        nav_shape: "Editor de forma",
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

        // --- Redesign ---
        // Nav / side menu
        nav_test: "Testar um toque",

        // Library
        no_touches_found: "Nenhum toque corresponde à sua busca.",

        // Record a touch (step 1)
        record_a_touch_title: "Gravar um toque",
        next_step: "Próximo passo",
        touch_name_label: "Nome do toque",
        description_label: "Descrição",
        air_in_chamber: "Ar na câmara (mL)",

        // Shape editor
        shape_name_label: "Nome da forma",
        shape_name_placeholder: "Nome da forma",
        shape_saved_alert: "Forma salva.",
        shape_save_failed_alert: "Não foi possível salvar a forma.",

        // Test a touch
        test_a_touch_title: "Testar um toque",
        select_a_touch: "Selecione um toque",
        play_touch: "Tocar",
        your_name_placeholder: "Seu nome",
        save_test_data: "Salvar dados do teste",
        enter_your_name_alert: "Digite seu nome antes de salvar os dados do teste.",

        // Touch detail
        back_to_library: "Voltar para a biblioteca",
        mood_panel_label: "Humor · circumplexo de Russell",
        media_panel_label: "Mídia",

        // Media (step 3)
        media_step_title: "Adicionar mídia",
        media_step_intro: "Adicione fotos ou vídeos de referência do arranjo físico deste toque.",
        finish: "Concluir",

        // --- Create an entry (merged record + shape flow) ---
        nav_create_entry: "Criar uma entrada",
        connect_kit: "Conectar kit",
        create_entry_title: "Criar uma entrada",
        capture_from_kit: "Capturar pelo kit",
        draw_shape: "Desenhar forma",
        save_touch: "Salvar toque",
        saving_label: "Salvando…",
        mood_step_intro: "Clique dentro do quadrado para marcar como este toque se sente no mapa de prazer/excitação.",
        felt_sensation_label: "Sensação sentida",
        draw_a_shape_alert: "Desenhe uma forma antes de salvar.",
        record_something_alert: "Grave ou desenhe um toque antes de salvar.",
        save_touch_failed_alert: "Não foi possível salvar este toque. Tente novamente.",
        remove: "Remover",
        close: "Fechar",
        previous: "Anterior",
        next: "Próximo",
        feedback_prompt_note: "Sentiu algo diferente? Conte para a equipe de pesquisa como este toque se compara à sensação pretendida.",
    },
};

export function t(key, language) {
    return translations[language]?.[key] ?? translations.en[key] ?? key;
}
