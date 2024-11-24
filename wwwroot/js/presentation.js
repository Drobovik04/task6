let currentSlide = null;
let slideElements = {}; // Хранит элементы для каждого слайда
let selectedElement = null; // Текущий выделенный элемент
let addingElement = null; // Тип добавляемого элемента
let dragOffset = { x: 0, y: 0 }; // Для корректного перемещения

const editorContainer = document.createElement('div'); // Для ввода текста

document.addEventListener("DOMContentLoaded", function () {
    // Обработка кликов по слайдам
    document.getElementById('slidesList').addEventListener('click', function (e) {
        const slideItem = e.target.closest('.slide-item');
        if (slideItem) {
            const slideId = slideItem.dataset.slideId;
            loadSlide(slideId);
        }
    });

    // Добавление текста
    document.getElementById('addText').addEventListener('click', () => startAddingElement('text'));
    // Добавление круга
    document.getElementById('addCircle').addEventListener('click', () => startAddingElement('circle'));

    // Обработчик для перемещения
    const currentSlideContainer = document.getElementById('currentSlide');
    currentSlideContainer.addEventListener('dragover', (e) => e.preventDefault());
    currentSlideContainer.addEventListener('click', (e) => {
        if (addingElement) {
            const { x, y } = getClickPosition(e, currentSlideContainer);
            addElementToSlide(addingElement, x, y, 50, 50);
            addingElement = null;
        } else {
            deselectElement();
        }
    });
    let urlParams = new URLSearchParams(window.location.search);
    const presentationId = urlParams.get('idPresentation');
    slideElements.Id = presentationId;
    slideElements.Name = "";
    slideElements.Slides = [];
    slideElements.Users = [];
    // Настраиваем редактор
    setupEditor();
});

function setupEditor() {
    editorContainer.style.position = 'absolute';
    editorContainer.style.display = 'none';
    editorContainer.style.backgroundColor = 'white';
    editorContainer.style.border = '1px solid #ccc';
    editorContainer.style.padding = '10px';
    editorContainer.style.zIndex = '1000';
    editorContainer.innerHTML = `
                <textarea id="editorInput" rows="3" style="width: 200px;"></textarea>
                <div class="d-flex mt-1">
                    <button id="saveEditor" class="btn btn-primary btn-sm">Сохранить</button>
                    <button id="deleteEditor" class="btn btn-danger btn-sm">Удалить</button>
                <\div
            `;
    document.body.appendChild(editorContainer);

    document.getElementById('saveEditor').addEventListener('click', saveEditor);
    document.getElementById('deleteEditor').addEventListener('click', deleteEditor);
}

function startAddingElement(type) {
    addingElement = type;
}

function getClickPosition(e, container) {
    const rect = container.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function addElementToSlide(type, X, Y, Width, Height) {
    var element;
    if (type == "text") {
        element = { type, Id: crypto.randomUUID(), Position: { X, Y }, Content: type === 'text' ? 'Текст' : '' };
    }
    else if (type == "circle") {
        element = { type, Id: crypto.randomUUID(), Position: { X, Y }, Size: { Width, Height}, Color: "#0000ff" }; //пока ширина и высота заглушка
    }
    //if (!slideElements.Slides[currentSlide].Elements) slideElements.Slides[currentSlide].Elements = [];
    slideElements.Slides.find(x => x.Id == currentSlide).Elements.push(element);
    renderSlideElements();
    saveSlideChanges()
}

function loadSlide(slideId) {
    currentSlide = slideId;

    // Обновляем выделение текущего слайда в списке
    document.querySelectorAll('.slide-item').forEach(item => item.classList.remove('active'));
    const activeSlide = document.querySelector(`.slide-item[data-slide-id="${slideId}"]`);
    if (activeSlide) {
        activeSlide.classList.add('active');
    }

    renderSlideElements();
}

function renderSlideElements() {
    const container = document.getElementById('currentSlide');
    container.innerHTML = '';
    if (!slideElements.Slides.find(x => x.Id == currentSlide)) return;

    slideElements.Slides.find(x => x.Id == currentSlide).Elements.forEach(element => {
        const el = document.createElement('div');
        el.classList.add('slide-element');
        el.dataset.index = element.Id;
        el.style.position = 'absolute';
        el.style.left = `${element.Position.X}px`;
        el.style.top = `${element.Position.Y}px`;
        el.style.border = selectedElement === element.Id ? '2px dashed blue' : 'none';

        if (element.type === 'text') {
            el.innerHTML = marked.parse(element.Content); // Преобразуем Markdown
            el.style.color = 'black';
            el.style.cursor = 'pointer';
        } else if (element.type === 'circle') {
            el.style.width = `${element.Size.Width}px`;
            el.style.height = `${element.Size.Height}px`;
            el.style.borderRadius = '50%';
            el.style.backgroundColor = 'blue';
            el.style.cursor = 'pointer';
        }

        // События для перемещения
        el.draggable = true;
        el.addEventListener('dragstart', (e) => dragStart(e, element.Id));
        el.addEventListener('dragend', (e) => dragEnd(e));

        // События для выделения и редактирования
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(element.Id, el);
        });

        container.appendChild(el);
    });
}

function dragStart(e, index) {
    selectedElement = index;
    dragOffset.x = e.offsetX;
    dragOffset.y = e.offsetY;
    e.dataTransfer.effectAllowed = 'move';
}

function dragEnd(e) {
    const rect = document.getElementById('currentSlide').getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    const rectElement = e.currentTarget.getBoundingClientRect();

    if (newX < 0 || newY < 0 || newX + rectElement.width > rect.right - rect.left || newY + rectElement.height > rect.bottom - rect.top)
        return;

    if (selectedElement !== null) {
        slideElements.Slides.find(x => x.Id == currentSlide).Elements.find(x => x.Id == selectedElement).Position.X = newX;
        slideElements.Slides.find(x => x.Id == currentSlide).Elements.find(x => x.Id == selectedElement).Position.Y = newY;
    }

    renderSlideElements();
    saveSlideChanges();
}

function selectElement(index, element) {
    selectedElement = index;

    const currentElement = slideElements.Slides.find(x => x.Id == currentSlide).Elements.find(x => x.Id == index);
    if (currentElement.type === 'text') {
        showEditor(currentElement, element);
    }

    renderSlideElements();
}

function deselectElement() {
    selectedElement = null;
    editorContainer.style.display = 'none';
    renderSlideElements();
}

function showEditor(element, domElement) {
    editorContainer.style.left = `${domElement.getBoundingClientRect().left}px`;
    editorContainer.style.top = `${domElement.getBoundingClientRect().top + domElement.offsetHeight}px`;
    editorContainer.style.display = 'block';
    document.getElementById('editorInput').value = element.Content;
}

function saveEditor() {
    if (selectedElement !== null) {
        const content = document.getElementById('editorInput').value;
        slideElements.Slides.find(x => x.Id == currentSlide).Elements.find(x => x.Id == selectedElement).Content = content; // Сохраняем Markdown
        editorContainer.style.display = 'none';
        renderSlideElements();
        saveSlideChanges()
    }
}

function deleteEditor() {
    if (selectedElement !== null) {
        slideElements.Slides.find(x => x.Id == currentSlide).Elements.filter(elem => elem.Id != selectedElement);
        selectedElement = null;
        editorContainer.style.display = 'none';
        renderSlideElements();
        saveSlideChanges()
    }
}
let owner = new URLSearchParams(window.location.search).get('isOwner');
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/presentationHub")
    .configureLogging(signalR.LogLevel.Debug)
    .build();

connection.on("UserJoined", (userId, userName, role) => {
    const userList = document.getElementById("usersList");
    const newUser = document.createElement("li");
    newUser.className = "list-group-item d-flex justify-content-between align-items-center";
    if (owner == "True") {
        newUser.innerHTML = userName + `<div>
                                    <form method="post" asp-page-handler="UserAction" class="d-inline">
                                        <input type="hidden" name="userId" value=$"{userId}" />
                                        <input type="hidden" name="action" value="action1" />
                                        <button type="submit" class="btn btn-sm role-btn btn-primary"><i class="fa-solid fa-pen"></i></button>
                                    </form>
                                    <form method="post" asp-page-handler="UserAction" class="d-inline">
                                        <input type="hidden" name="userId" value=$"{userId}" />
                                        <input type="hidden" name="action" value="action2" />
                                        <button type="submit" class="btn btn-sm role-btn btn-primary"><i class="fa-solid fa-eye"></i></button>
                                    </form>
                                </div>`;
    }
    else {
        newUser.innerHTML = userName;
    }
    userList.appendChild(newUser);
});

connection.on("SlideAdded", (newSlide, position) => {
    const slideList = document.getElementById("slidesList");

    const slideItem = document.createElement("li");
    slideItem.className = `list-group-item slide-item ${currentSlide === newSlide.id ? "active" : ""}`;
    slideItem.dataset.slideId = newSlide.id;
    slideItem.id = newSlide.id;
    slideItem.textContent = `${newSlide.id}`;
    slideItem.onclick = () => {
        currentSlide = newSlide.id;
        loadSlide(newSlide.id);
        //sendUpdate();
    };

    if (position !== null) {
        // Вставляем слайд в указанную позицию
        slideList.appendChild(slideItem, slideList.children.find(x => x.id));
    } else {
        // Если позиция не указана или некорректна, добавляем в конец
        slideList.appendChild(slideItem);
    }
    //sendUpdate();
    console.log("New slide added at position:", position, newSlide);
});

async function addSlide(presentationId) {
    const positionInput = document.getElementById("slidePositionInput");
    const position = positionInput.value ? positionInput.value : null;

    if (!position) {
        // Если введено некорректное значение, очищаем поле и добавляем в конец
        positionInput.value = "";
    }

    await connection.invoke("AddSlide", presentationId, position);
}

connection.on("SlideDeleted", (slideId) => {
    const slideElement = document.getElementById(slideId);
    if (slideElement) {
        slideElement.remove();
        console.log(`Slide $"{slideId}" deleted.`);
    }
    sendUpdate();
    // Если нужно обновить позиции (например, если они отображаются в UI)
    //const slideContainer = document.getElementById("slidesList");
    //Array.from(slideContainer.children).forEach((child, index) => {
    //    child.textContent = `Slide: ${child.id.replace("slide-", "")} (Position: ${index + 1})`;
    //});
});

async function deleteSlide(presentationId) {
    const positionInput = document.getElementById("slidePositionInput");
    const position = positionInput.value ? positionInput.value : null;
    if (!position) {
        console.warn("Invalid position.");
        positionInput.value = "";
        return;
    }
    await connection.invoke("DeleteSlide", presentationId, position);
}
connection.on("ReceiveUpdate", (data) => {
    slideElements = JSON.parse(data);
    renderSlidesList(slideElements.Slides); // Рендерим обновленный список слайдов
    renderUsersList(slideElements.Users);  // Рендерим обновленный список пользователей
    slideElements = slideElements;
    renderSlideElements();
    if (currentSlide) {
        const slide = slideElements.Slides.find(s => s.Id === currentSlide);
        if (slide) {
            slideElements.Slides.find(x => x.Id == currentSlide).Elements = slide.Elements || [];
            renderSlideElements();
        }
    }
    //renderSlidesList(slideElements.slides);
    //renderUsersList(slideElements.users);
    //if (currentSlide) {
    //    loadSlide(currentSlide);
    //}
});

connection.on("TestGroup", (message) => {
    console.log("TestGroup message received:", message);
});

function sendUpdate() {
    connection.invoke("UpdatePresentation", JSON.stringify(slideElements));
};

function renderUsersList(users) {
    const userList = document.getElementById("usersList");
    userList.innerHTML = "";
    var urlParams = new URLSearchParams(window.location.search);
    var owner = urlParams.get('isOwner');
    users.forEach(user => {
        const userList = document.getElementById("usersList");
        const newUser = document.createElement("li");
        newUser.className = "list-group-item d-flex justify-content-between align-items-center";
        if (owner == "True") {
            newUser.innerHTML = user.Nickname + `<div>
                                    <form method="post" asp-page-handler="UserAction" class="d-inline">
                                        <input type="hidden" name=$"{user.ConnectionId}" value=$"{user.ConnectionId}" />
                                        <input type="hidden" name="action" value="action1" />
                                        <button type="submit" class="btn btn-sm role-btn btn-primary"><i class="fa-solid fa-pen"></i></button>
                                    </form>
                                    <form method="post" asp-page-handler="UserAction" class="d-inline">
                                        <input type="hidden" name=$"{user.ConnectionId}" value=$"{user.ConnectionId}" />
                                        <input type="hidden" name="action" value="action2" />
                                        <button type="submit" class="btn btn-sm role-btn btn-primary"><i class="fa-solid fa-eye"></i></button>
                                    </form>
                                </div>`;
        }
        else {
            newUser.innerHTML = user.Nickname;
        }
        userList.appendChild(newUser);
    });
}

function renderSlidesList(slides) {
    const slideList = document.getElementById("slidesList");
    slideList.innerHTML = "";

    slides.forEach(slide => {
        const slideItem = document.createElement("li");
        slideItem.className = `list-group-item slide-item ${currentSlide === slide.Id ? "active" : ""}`;
        slideItem.dataset.slideId = slide.Id;
        slideItem.textContent = `${slide.Id}`;
        slideItem.onclick = () => {
            currentSlide = slide.Id;
            loadSlide(slide.Id);
            //sendUpdate();
        };
        slideList.appendChild(slideItem);
    });

}

function saveSlideChanges() {
    //const slide = slideElements[currentSlide];
    //if (slide) {
    //    slide.Elements = slideElements[currentSlide] || [];
        sendUpdate();
    //}
}

function updateRoleButtons(user, parentElement) {
    const buttons = parentElement.querySelectorAll(".role-btn");
    buttons.forEach(btn => {
        btn.classList.toggle("btn-primary");
        btn.classList.toggle("btn-outline-secondary");
    });
}
async function startConnection() {
    try {
        await connection.start();
        let urlParams = new URLSearchParams(window.location.search);
        let nickname = urlParams.get('nickName');
        const presentationId = urlParams.get('idPresentation');
        await connection.invoke("JoinPresentation", presentationId, nickname);
        console.log("SignalR connection started.", connection.id);
    } catch (err) {
        console.error("Error while starting connection: ", err);
        setTimeout(startConnection, 1000);
    }
}

startConnection();
