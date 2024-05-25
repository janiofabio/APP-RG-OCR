document.addEventListener('DOMContentLoaded', () => {
    alert("DOM completamente carregado");

    const api = "https://script.google.com/macros/s/AKfycbxGgPnMwV7MLIyhTfPIYqXbRA4-e6RJ8JGfF22h6dfkHH_m-slT6wC2GrsBfuxajhUD/exec";
    const msg = document.querySelector(".message");
    const fileInput = document.querySelector(".file");
    const captureFrontBtn = document.querySelector(".capture-front-btn");
    const captureBackBtn = document.querySelector(".capture-back-btn");
    const snapBtn = document.querySelector(".snap-btn");
    const video = document.querySelector("#video");
    const canvas = document.querySelector("#canvas");
    const capturedImageFront = document.querySelector(".captured-image-front");
    const capturedImageBack = document.querySelector(".captured-image-back");
    const btn = document.querySelector(".btn");
    const progressBarFill = document.querySelector(".progress-bar-fill");
    const progressInfo = document.querySelector(".progress-info");

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    let frontImageBase64 = '';
    let backImageBase64 = '';
    let capturingFront = false;

    const isMobile = window.matchMedia("only screen and (max-width: 767px)").matches;

    if (isMobile) {
        captureFrontBtn.style.display = 'inline-block';
        captureBackBtn.style.display = 'inline-block';
        alert("Modo mobile detectado, botões de captura exibidos");
    } else {
        captureFrontBtn.style.display = 'none';
        captureBackBtn.style.display = 'none';
        alert("Modo desktop detectado, botões de captura ocultos");
    }

    captureFrontBtn.addEventListener('click', () => {
        capturingFront = true;
        startCapture();
    });

    captureBackBtn.addEventListener('click', () => {
        capturingFront = false;
        startCapture();
    });

    function startCapture() {
        alert("Botão de captura clicado");
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
        }).then(stream => {
            video.style.display = 'block';
            snapBtn.style.display = 'block';
            video.srcObject = stream;
            alert("Câmera traseira ativada");
        }).catch(err => {
            console.error("Erro ao acessar a câmera traseira:", err);
            alert("Erro ao acessar a câmera traseira: " + err.message);
        });
    }

    snapBtn.addEventListener('click', () => {
        alert("Botão de tirar foto clicado");
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        video.style.display = 'none';
        snapBtn.style.display = 'none';
        canvas.style.display = 'none';
        if (capturingFront) {
            capturedImageFront.style.display = 'block';
            capturedImageFront.src = canvas.toDataURL('image/jpeg');
            frontImageBase64 = capturedImageFront.src.split(',')[1];
        } else {
            capturedImageBack.style.display = 'block';
            capturedImageBack.src = canvas.toDataURL('image/jpeg');
            backImageBase64 = capturedImageBack.src.split(',')[1];
        }
        alert("Foto capturada e exibida");
        fileInput.value = ''; // Limpa o arquivo selecionado anteriormente
    });

    btn.addEventListener('click', () => {
        alert("Botão de gerar OCR clicado");
        const file = fileInput.files ? fileInput.files[0] : null;
        if (!file && (!frontImageBase64 || !backImageBase64)) {
            alert("Selecione um arquivo PDF ou capture as imagens de frente e verso primeiro.");
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
        } else if (frontImageBase64 && backImageBase64) {
            alert("Imagens capturadas, iniciando OCR");
            processOCR(frontImageBase64, 'image/jpeg', 'captured_front_image.jpg', startTime, true);
        }
    });

    function processOCR(base64Data, fileType, fileName, startTime, isFront) {
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
            if (isFront) {
                processOCR(backImageBase64, 'image/jpeg', 'captured_back_image.jpg', Date.now(), false);
            } else {
                openTextInNewWindow(data);
            }
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
