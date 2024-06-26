document.addEventListener('DOMContentLoaded', () => {
    alert("DOM completamente carregado");

    const api = "https://script.google.com/macros/s/AKfycbxGgPnMwV7MLIyhTfPIYqXbRA4-e6RJ8JGfF22h6dfkHH_m-slT6wC2GrsBfuxajhUD/exec";
    const msg = document.querySelector(".message");
    const fileInput = document.querySelector(".file");
    const captureBtn = document.querySelector(".capture-btn");
    const snapBtn = document.querySelector(".snap-btn");
    const video = document.querySelector("#video");
    const canvas = document.querySelector("#canvas");
    const capturedImage = document.querySelector(".captured-image");
    const btn = document.querySelector(".btn");
    const progressBarFill = document.querySelector(".progress-bar-fill");
    const progressInfo = document.querySelector(".progress-info");

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    let imageBase64 = '';

    const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;

    if (isMobile) {
        captureBtn.style.display = 'inline-block';
        alert("Modo mobile detectado, botão de captura exibido");
    } else {
        captureBtn.style.display = 'none';
        alert("Modo desktop detectado, botão de captura oculto");
    }

    captureBtn.addEventListener('click', async () => {
    alert("Botão de captura clicado");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
                advanced: [{ focusMode: "continuous" }] // Tenta habilitar o foco contínuo
            }
        });
        video.style.display = 'block';
        snapBtn.style.display = 'block';
        video.srcObject = stream;
        alert("Câmera traseira ativada com foco contínuo");
    } catch (err) {
        console.error("Erro ao acessar a câmera traseira:", err);
        alert("Erro ao acessar a câmera traseira: " + err.message);
    }
});


   snapBtn.addEventListener('click', () => {
    alert("Botão de tirar foto clicado");
    const context = canvas.getContext('2d');
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Ajuste do tamanho do canvas para manter a proporção da imagem
    const maxCanvasWidth = window.innerWidth * 0.8; // 80% da largura da janela
    const aspectRatio = videoWidth / videoHeight;
    let canvasWidth = maxCanvasWidth;
    let canvasHeight = maxCanvasWidth / aspectRatio;

    if (canvasHeight > window.innerHeight) {
        canvasHeight = window.innerHeight * 0.8; // 80% da altura da janela
        canvasWidth = canvasHeight * aspectRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    context.drawImage(video, 0, 0, videoWidth, videoHeight, 0, 0, canvasWidth, canvasHeight);
    video.style.display = 'none';
    snapBtn.style.display = 'none';
    capturedImage.style.display = 'block';
    capturedImage.src = canvas.toDataURL('image/jpeg');
    imageBase64 = capturedImage.src.split(',')[1];
    canvas.style.display = 'none';
    alert("Foto capturada e exibida");
    fileInput.value = ''; // Limpa o arquivo selecionado anteriormente
});


    btn.addEventListener('click', () => {
        alert("Botão de gerar OCR clicado");
        const file = fileInput.files ? fileInput.files[0] : null;
        if (!file && !imageBase64) {
            alert("Selecione um arquivo PDF ou capture uma imagem primeiro.");
            return;
        }

        if (file && file.size > MAX_FILE_SIZE) {
            alert("O arquivo é muito grande. O tamanho máximo é de 5MB.");
            return;
        }

        msg.innerHTML = `Carregando...`;
        progressBarFill.style.width = '0%';
        progressInfo.innerHTML = '';
        alert("Iniciando processamento OCR");

        let startTime = Date.now();

        if (file) {
            let fr = new FileReader();
            fr.readAsDataURL(file);
            fr.onload = () => {
                let res = fr.result;
                let b64 = res.split("base64,")[1];
                alert("Arquivo lido, iniciando OCR");
                processOCR(b64, file.type, file.name, startTime);
            };
        } else if (imageBase64) {
            alert("Imagem capturada, iniciando OCR");
            processOCR(imageBase64, 'image/jpeg', 'captured_image.jpg', startTime);
        }
    });

    function processOCR(base64Data, fileType, fileName, startTime) {
        alert("Processando OCR");
        let uploadProgress = setInterval(() => {
            let elapsed = Date.now() - startTime;
            let percentComplete = Math.min(100, (elapsed / 2000) * 100); 
            progressBarFill.style.width = `${percentComplete}%`;
            progressInfo.innerHTML = `Carregando: ${Math.round(percentComplete)}% - Tempo restante: ${Math.max(0, ((2000 - elapsed) / 1000).toFixed(1))}s - Tamanho do arquivo: ${(base64Data.length * 0.75 / 1024).toFixed(2)} KB`;
            if (percentComplete >= 100) clearInterval(uploadProgress);
        }, 100);

        fetch(api, {
            method: "POST",
            body: JSON.stringify({
                file: base64Data,
                type: fileType,
                name: fileName
            })
        })
        .then(res => res.text())
        .then(data => {
            clearInterval(uploadProgress);
            progressBarFill.style.width = '100%';
            msg.innerHTML = ``;
            alert("OCR concluído, exibindo resultado");
            openTextInNewWindow(data);
        })
        .catch(error => {
            clearInterval(uploadProgress);
            msg.innerHTML = `Erro ao processar o arquivo.`;
            alert("Erro ao processar o arquivo: " + error.message);
            console.error('Error:', error);
        });
    }

    function openTextInNewWindow(text) {
        alert("Abrindo resultado do OCR em nova janela");
        let newWindow = window.open("", "_blank");
        newWindow.document.write("<html><head><title>OCR Resultado</title></head><body>");
        newWindow.document.write("<pre>" + text + "</pre>");
        newWindow.document.write("</body></html>");
        newWindow.document.close();
    }
});
