var currentSlide = null;
var slideElements = {};
var selectedElement = null;
var addingElement = null; 
var dragOffset = { x: 0, y: 0 };
var userRole;

const editorContainer = document.createElement('div');

document.addEventListener("DOMContentLoaded", function () {

    document.getElementById('slidesList').addEventListener('click', function (e) {
        const slideItem = e.target.closest('.slide-item');
        if (slideItem) {
            const slideId = slideItem.dataset.slideId;
            loadSlide(slideId);
        }
    });


    document.getElementById('addText').addEventListener('click', () => startAddingElement('text'));

    document.getElementById('addCircle').addEventListener('click', () => startAddingElement('circle'));

    //document.getElementById('addArrow').addEventListener('click', () => startAddingElement('arrow'));

    document.getElementById("addRectangle").addEventListener("click", () => startAddingElement('rectangle'));

    //document.getElementById("addImage").addEventListener("click", () => {
    //    document.getElementById("imageInput").click();
    //});
    //document.getElementById("imageInput").addEventListener("change", handleImageUpload);

    document.getElementById("exportToPDF").addEventListener("click", () => exportToPDF());

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
    var urlParams = new URLSearchParams(window.location.search);
    const presentationId = urlParams.get('idPresentation');
    slideElements.Id = presentationId;
    slideElements.Name = "";
    slideElements.Slides = [];
    slideElements.Users = [];

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
                    <button id="saveEditor" class="btn btn-primary btn-sm">Save</button>
                    <button id="deleteEditor" class="btn btn-danger btn-sm">Delete</button>
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

function handleImageUpload(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const imageSrc = e.target.result;

            // Задаем параметры изображения
            const image = {
                id: Date.now(), // Уникальный идентификатор
                top: "100px",
                left: "100px",
                width: "200px",
                height: "150px",
                src: imageSrc
            };

        };

        reader.readAsDataURL(file); // Преобразуем файл в base64
    }
}

function addElementToSlide(type, X, Y, Width, Height) {
    if (userRole == 2) {
        return;
    }
    var element;
    if (type == "text") {
        element = { type, Id: crypto.randomUUID(), Position: { X, Y }, Content: type === 'text' ? 'Text' : '' };
    }
    else if (type == "circle") {
        element = { type, Id: crypto.randomUUID(), Position: { X, Y }, Size: { Width, Height }, Color: "#0000ff", Angle: 0 };
    }
    //else if (type == "arrow") {
    //    element = { type, Id: crypto.randomUUID(), Position: { X, Y }, Size: { Width, Height }, Color: "#0000ff", EndPosition: { X: X + 5, Y: Y + 5} };
    //}
    else if (type === "rectangle") {
        element = { type, Id: crypto.randomUUID(), Position: { X, Y }, Size: { Width, Height }, Color: "#0000ff", Angle: 0 };
    }

    if (slideElements.Slides.find(x => x.Id == currentSlide) != null) {
        slideElements.Slides.find(x => x.Id == currentSlide).Elements.push(element);
    }
    renderSlideElements();
    saveSlideChanges()
}

function loadSlide(slideId) {
    currentSlide = slideId;

    document.querySelectorAll('.slide-item').forEach(item => item.classList.remove('active'));
    const activeSlide = document.querySelector(`.slide-item[data-slide-id="${slideId}"]`);
    if (activeSlide) {
        activeSlide.classList.add('active');
    }

    renderSlideElements();
}

function renderSlideElements() {
    const container = document.getElementById('currentSlide');
    const containerCanvas = document.getElementById('currentSlideCanvas');
    container.innerHTML = '';
    if (!slideElements.Slides.find(x => x.Id == currentSlide)) return;

    slideElements.Slides.find(x => x.Id == currentSlide).Elements.forEach(element => {
        var el;

        if (element.type === 'text') {
            el = document.createElement('div');
            el.style.left = `${element.Position.X}px`;
            el.style.top = `${element.Position.Y}px`;
            el.innerHTML = marked.parse(element.Content);
            el.style.color = 'black';
            el.style.cursor = 'pointer';
        } else if (element.type === 'circle') {
            el = document.createElement('div');
            el.style.left = `${element.Position.X}px`;
            el.style.top = `${element.Position.Y}px`;
            el.style.width = `${element.Size.Width}px`;
            el.style.height = `${element.Size.Height}px`;
            el.style.borderRadius = '50%';
            el.style.backgroundColor = `${element.Color}`;
            el.style.cursor = 'pointer';
            el.style.transform = `rotate(${element.Angle}deg)`;
        } else if (element.type === 'rectangle') {
            el = document.createElement('div');
            el.style.left = `${element.Position.X}px`;
            el.style.top = `${element.Position.Y}px`;
            el.style.width = `${element.Size.Width}px`;
            el.style.height = `${element.Size.Height}px`;
            el.style.backgroundColor = `${element.Color}`;
            el.style.cursor = 'pointer';
            el.style.transform = `rotate(${element.Angle}deg)`;
        }
        else if (element.type === 'arrow') {
            el = document.createElementNS("http://www.w3.org/2000/svg", "line");
            el.setAttribute("x1", element.Position.X);
            el.setAttribute("y1", element.Position.Y);
            el.setAttribute("x2", element.EndPosition.X);
            el.setAttribute("y2", element.EndPosition.Y);
            el.setAttribute("stroke", "black");
            el.setAttribute("stroke-width", "2");
            el.style.cursor = "pointer";
        }

        el.classList.add('slide-element');
        el.dataset.index = element.Id;
        el.style.position = 'absolute';

        el.draggable = true;

        el.style.border = selectedElement === element.Id ? '2px dashed rgba(0, 0, 0, 0.15)' : 'none';


        el.addEventListener('dragstart', (e) => dragStart(e, element.Id));
        el.addEventListener('dragend', (e) => dragEnd(e));

        el.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(element.Id, el);
        });
        if (element.type === 'arrow') {
            containerCanvas.appendChild(el);
        }
        else {
            container.appendChild(el);
        }
    });
}

function dragStart(e, index) {
    if (userRole == 2) {
        return;
    }
    selectedElement = index;
    dragOffset.x = e.offsetX;
    dragOffset.y = e.offsetY;
    e.dataTransfer.effectAllowed = 'move';
}

function dragEnd(e) {
    if (userRole == 2) {
        return;
    }
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
    if (userRole == 2) {
        return;
    }
    selectedElement = index;

    const currentElement = slideElements.Slides.find(x => x.Id == currentSlide).Elements.find(x => x.Id == index);
    if (currentElement.type == 'text') {
        showEditor(currentElement, element);
    }
    else if (currentElement.type == 'circle') {
        showEditor(currentElement, element);
    }
    else if (currentElement.type == 'rectangle') {
        showEditor(currentElement, element);
    }

    renderSlideElements();
}

function deselectElement() {
    if (userRole == 2) {
        return;
    }
    selectedElement = null;
    editorContainer.style.display = 'none';
    renderSlideElements();
}

function showEditor(element, domElement) {
    if (element.type == 'text') {
        editorContainer.innerHTML = `
            <textarea id="editorInput" rows="3" style="width: 200px;">${element.Content}</textarea>
            <div class="d-flex mt-1">
                <button id="saveEditor" class="btn btn-primary btn-sm">Save</button>
                <button id="deleteEditor" class="btn btn-danger btn-sm">Delete</button>
            </div>
        `;
        document.getElementById('saveEditor').addEventListener('click', saveEditor);
        document.getElementById('deleteEditor').addEventListener('click', deleteEditor);
    } else if (element.type == 'circle') {
        editorContainer.innerHTML = `
            <label>Color: <input type="color" id="colorInput" value="${element.Color}" /></label><br/>
            <label>Width: <input type="number" id="widthInput" value="${element.Size.Width}" /></label><br/>
            <label>Height: <input type="number" id="heightInput" value="${element.Size.Height}" /></label><br/>
            <label>Angle: <input type="number" min="0" max="360" id="angleInput" value="${element.Angle}" /></label><br/>
            <div class="d-flex mt-1">
                <button id="saveShapeEditor" class="btn btn-primary btn-sm">Save</button>
                <button id="deleteEditor" class="btn btn-danger btn-sm">Delete</button>
            </div>
        `;
        document.getElementById('saveShapeEditor').addEventListener('click', () => saveShapeEditor(element));
        document.getElementById('deleteEditor').addEventListener('click', deleteEditor);
    } else if (element.type === 'rectangle') {
        editorContainer.innerHTML = `
            <label>Color: <input type="color" id="colorInput" value="${element.Color}" /></label><br/>
            <label>Width: <input type="number" id="widthInput" value="${element.Size.Width}" /></label><br/>
            <label>Height: <input type="number" id="heightInput" value="${element.Size.Height}" /></label><br/>
            <label>Angle: <input type="number" min="0" max="360" id="angleInput" value="${element.Angle}" /></label><br/>
            <div class="d-flex mt-1">
                <button id="saveShapeEditor" class="btn btn-primary btn-sm">Save</button>
                <button id="deleteEditor" class="btn btn-danger btn-sm">Delete</button>
            </div>
        `;
        document.getElementById('saveShapeEditor').addEventListener('click', () => saveShapeEditor(element));
        document.getElementById('deleteEditor').addEventListener('click', deleteEditor);
    } else if (element.type === 'arrow') {
        editorContainer.innerHTML = `
            <label>Start X: <input type="number" id="startXInput" value="${element.Start.X}" /></label><br/>
            <label>Start Y: <input type="number" id="startYInput" value="${element.Start.Y}" /></label><br/>
            <label>End X: <input type="number" id="endXInput" value="${element.End.X}" /></label><br/>
            <label>End Y: <input type="number" id="endYInput" value="${element.End.Y}" /></label><br/>
            <div class="d-flex mt-1">
                <button id="saveArrowEditor" class="btn btn-primary btn-sm">Save</button>
                <button id="deleteEditor" class="btn btn-danger btn-sm">Delete</button>
            </div>
        `;
        document.getElementById('saveArrowEditor').addEventListener('click', () => saveArrowEditor(element));
        document.getElementById('deleteEditor').addEventListener('click', deleteEditor);
    }

    editorContainer.style.left = `${domElement.getBoundingClientRect().left}px`;
    editorContainer.style.top = `${domElement.getBoundingClientRect().top + domElement.offsetHeight}px`;
    editorContainer.style.display = 'block';
}
function saveArrowEditor(element) {
    const startX = parseInt(document.getElementById('startXInput').value, 10);
    const startY = parseInt(document.getElementById('startYInput').value, 10);
    const endX = parseInt(document.getElementById('endXInput').value, 10);
    const endY = parseInt(document.getElementById('endYInput').value, 10);

    element.Start.X = startX;
    element.Start.Y = startY;
    element.End.X = endX;
    element.End.Y = endY;

    editorContainer.style.display = 'none';
    renderSlideElements();
    saveSlideChanges();
}
function saveShapeEditor(element) {
    const newColor = document.getElementById('colorInput').value;
    const newWidth = parseInt(document.getElementById('widthInput').value, 10);
    const newHeight = parseInt(document.getElementById('heightInput').value, 10);
    const newAngle = parseInt(document.getElementById('angleInput').value, 10);

    element.Color = newColor;
    element.Size.Width = newWidth;
    element.Size.Height = newHeight;
    element.Angle = newAngle;

    editorContainer.style.display = 'none';
    renderSlideElements();
    saveSlideChanges();
}

function moveEditorAfterDrag(domElement) {
    editorContainer.style.left = `${domElement.getBoundingClientRect().left}px`;
    editorContainer.style.top = `${domElement.getBoundingClientRect().top + domElement.offsetHeight}px`;
}

function saveEditor() {
    if (userRole == 2) {
        return;
    }
    if (selectedElement !== null) {
        const content = document.getElementById('editorInput').value;
        slideElements.Slides.find(x => x.Id == currentSlide).Elements.find(x => x.Id == selectedElement).Content = content; // Сохраняем Markdown
        editorContainer.style.display = 'none';
        renderSlideElements();
        saveSlideChanges()
    }
}

function deleteEditor() {
    if (userRole == 2) {
        return;
    }
    if (selectedElement !== null) {
        slideElements.Slides.find(x => x.Id == currentSlide).Elements.filter(elem => elem.Id != selectedElement);
        selectedElement = null;
        editorContainer.style.display = 'none';
        renderSlideElements();
        saveSlideChanges()
    }
}
var owner = new URLSearchParams(window.location.search).get('isOwner');
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/presentationHub")
    .configureLogging(signalR.LogLevel.Debug)
    .build();

connection.on("UserJoined", (userId, userName, role) => {
    //const userList = document.getElementById("usersList");
    //const newUser = document.createElement("li");
    //newUser.className = "list-group-item d-flex justify-content-between align-items-center";
    //if (owner == "True") {
    //    newUser.innerHTML = userName + `<div>
    //                                <form method="post" asp-page-handler="UserAction" class="d-inline">
    //                                    <input type="hidden" name="userId" value=$"{userId}" />
    //                                    <input type="hidden" name="action" value="action1" />
    //                                    <button type="submit" class="btn btn-sm role-btn btn-primary"><i class="fa-solid fa-pen"></i></button>
    //                                </form>
    //                                <form method="post" asp-page-handler="UserAction" class="d-inline">
    //                                    <input type="hidden" name="userId" value=$"{userId}" />
    //                                    <input type="hidden" name="action" value="action2" />
    //                                    <button type="submit" class="btn btn-sm role-btn btn-primary"><i class="fa-solid fa-eye"></i></button>
    //                                </form>
    //                            </div>`;
    //}
    //else {
    //    newUser.innerHTML = userName;
    //}
    //userList.appendChild(newUser);
});

connection.on("SlideAdded", (newSlide, position) => {
    //const slideList = document.getElementById("slidesList");
    //var i = 1;
    //const slideItem = document.createElement("li");
    //slideItem.className = `list-group-item slide-item ${currentSlide === newSlide.id ? "active" : ""}`;
    //slideItem.dataset.slideId = newSlide.id;
    //slideItem.id = newSlide.id;
    //slideItem.textContent = i++;
    //slideItem.onclick = () => {
    //    currentSlide = newSlide.id;
    //    loadSlide(newSlide.id);
    //    //sendUpdate();
    //};
    //if (position !== null) {
    //    slideList.appendChild(slideItem, slideList.children.find(x => x.id));
    //} else {
    //    slideList.appendChild(slideItem);
    //}
    ////sendUpdate();
    //console.log("New slide added at position:", position, newSlide);
});

async function addSlide(presentationId) {
    if (userRole != 0) {
        return;
    }
    //const positionInput = document.getElementById("slidePositionInput");
    //var position = positionInput.value ? positionInput.value : null;

    //if (isNaN(position) || position == null) {
    //    positionInput.value = "";
    //    await connection.invoke("AddSlide", presentationId, position);
    //}
    //else {
    //    position = Number(position);
    //    const listItems = document.querySelectorAll("#slidesList li.list-group-item");
    //    const listItem = Array.from(listItems).find(item => item.textContent.trim() == position);
    //    await connection.invoke("AddSlide", presentationId, listItem.dataset.slideId);
    //}
    if (currentSlide != null) {
        if (slideElements.Slides.find(x => x.Id == currentSlide) != null) {
            await connection.invoke("AddSlide", presentationId, currentSlide);
        }
    }
    else {
        await connection.invoke("AddSlide", presentationId, null);
    }
}

connection.on("SlideDeleted", (slideId) => {
    const slideElement = document.getElementById(slideId);
    if (slideElement) {
        slideElement.remove();
    }
    sendUpdate();
});

async function deleteSlide(presentationId) {
    if (userRole != 0) {
        return;
    }
    //const positionInput = document.getElementById("slidePositionInput");
    //var position = positionInput.value ? positionInput.value : null;

    //if (isNaN(position) || position == null) {
    //    positionInput.value = "";
    //}
    //else {
    //    position = Number(position);
    //    const listItems = document.querySelectorAll("#slidesList li.list-group-item");
    //    const listItem = Array.from(listItems).find(item => item.textContent.trim() == position);
    //    await connection.invoke("DeleteSlide", presentationId, listItem.dataset.slideId);
    //}
    if (currentSlide != null) {
        if (slideElements.Slides.find(x => x.Id == currentSlide) != null) {
            await connection.invoke("DeleteSlide", presentationId, currentSlide);
            currentSlide = null;
        }
    }

}
connection.on("ReceiveUpdate", (data) => {
    slideElements = JSON.parse(data);
    var urlParams = new URLSearchParams(window.location.search);
    var nickname = urlParams.get('nickName');
    userRole = slideElements.Users.find(x => x.Nickname == nickname).Role;
    renderSlidesList(slideElements.Slides);
    renderUsersList(slideElements.Users);
    slideElements = slideElements;
    renderSlideElements();
    if (currentSlide) {
        const slide = slideElements.Slides.find(s => s.Id === currentSlide);
        if (slide) {
            slideElements.Slides.find(x => x.Id == currentSlide).Elements = slide.Elements || [];
            renderSlideElements();
        }
    }
    connection.invoke("GetSlidesMemoryUsage", slideElements.Id);
});

connection.on("ReceiveSize", (memoryUsage) => {
    updateSlideInfo(memoryUsage);
});

function renderAll() {
    var urlParams = new URLSearchParams(window.location.search);
    var nickname = urlParams.get('nickName');
    userRole = slideElements.Users.find(x => x.Nickname == nickname).Role;
    slideElements = slideElements;
    renderSlideElements();
    if (currentSlide) {
        const slide = slideElements.Slides.find(s => s.Id === currentSlide);
        if (slide) {
            slideElements.Slides.find(x => x.Id == currentSlide).Elements = slide.Elements || [];
            renderSlideElements();
        }
    }
}

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
    var nick = urlParams.get('nickName');
    users.forEach(user => {
        const userList = document.getElementById("usersList");
        const newUser = document.createElement("li");
        newUser.className = "list-group-item d-flex justify-content-between align-items-center";
        if (owner == "True" && user.Nickname != nick) {
            const roleClassEditor = user.Role == 1 ? "btn-outline-success" : "btn-outline-secondary";
            const roleClassViewer = user.Role == 2 ? "btn-outline-success" : "btn-outline-secondary";
            newUser.innerHTML = user.Nickname + `<div>
                                    <div class="d-inline changerole">
                                        <input type="hidden" name=$"{user.Nickname}" value=$"{user.ConnectionId}" />
                                        <input type="hidden" name="action" value="editor" />
                                        <button class="btn btn-sm role-btn ${roleClassEditor}" onclick="changeRole('${slideElements.Id}', '${user.Nickname}', 1)"><i class="fa-solid fa-pen"></i></button>
                                    </div>
                                    <div class="d-inline changerole">
                                        <input type="hidden" name=$"{user.Nickname}" value=$"{user.ConnectionId}" />
                                        <input type="hidden" name="action" value="viewer" />
                                        <button class="btn btn-sm role-btn ${roleClassViewer}" onclick="changeRole('${slideElements.Id}', '${user.Nickname}', 2)"><i class="fa-solid fa-eye"></i></button>
                                    </div>
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
    var i = 1;
    slides.forEach(slide => {
        const slideItem = document.createElement("li");
        slideItem.className = `list-group-item slide-item ${currentSlide === slide.Id ? "active" : ""}`;
        slideItem.dataset.slideId = slide.Id;
        slideItem.textContent = i++;
        slideItem.onclick = () => {
            currentSlide = slide.Id;
            loadSlide(slide.Id);
        };
        slideList.appendChild(slideItem);
    });

}

function saveSlideChanges() {
   sendUpdate();
}

async function changeRole(presentationId, username, role) {
    var urlParams = new URLSearchParams(window.location.search);
    var owner = urlParams.get('isOwner');

    if (owner == "True") {
        await connection.invoke("ChangeRole", presentationId, username, role);
    }
    else {
        //не имеет права
    }
}

document.addEventListener('fullscreenchange', () => {
    const isFullscreen = document.fullscreenElement != null;
    const presentationContainer = document.getElementById('currentSlide');
    if (isFullscreen) {
        document.addEventListener('keydown', handleSlideNavigation);
        presentationContainer.addEventListener('click', handleSlideNavigation);
    } else {
        document.removeEventListener('keydown', handleSlideNavigation);
        presentationContainer.removeEventListener('click', handleSlideNavigation);
    }
});
function presentMode() {
    const presentationContainer = document.getElementById('currentSlide');
    presentationContainer.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message}`);
    });
    renderSlideElements();
    document.addEventListener('keydown', handleSlideNavigation);
    presentationContainer.addEventListener('click', handleSlideNavigation);
}

function handleSlideNavigation(event) {
    if (event.type === 'keydown') {
        if (event.key === 'ArrowRight') {
            nextSlide();
        } else if (event.key === 'ArrowLeft') {
            previousSlide();
        }
    } else if (event.type === 'click') {
        nextSlide();
    }
}

function nextSlide() {
    var index = slideElements.Slides.findIndex(x => x.Id == currentSlide);
    if (index < slideElements.Slides.length - 1) {
        currentSlide = slideElements.Slides[index + 1].Id;
        renderSlideElements();
    }
}

function previousSlide() {
    var index = slideElements.Slides.findIndex(x => x.Id == currentSlide);
    if (index > 0) {
        currentSlide = slideElements.Slides[index - 1].Id;
        renderSlideElements();
    }
}

function updateRoleButtons(user, parentElement) {
    const buttons = parentElement.querySelectorAll(".role-btn");
    buttons.forEach(btn => {
        btn.classList.toggle("btn-primary");
        btn.classList.toggle("btn-outline-secondary");
    });
}

function updateSlideInfo(memoryUsage) {
    const slideCount = slideElements.Slides.length;

    document.getElementById("slideCount").textContent = `Slides: ${slideCount}`;
    document.getElementById("memoryUsage").textContent = `Occupied memory on the server: ${memoryUsage} bytes`;
}

async function exportToPDF() {
    const slideData = slideElements;
    var container = document.getElementById('hiddenForPDF');
    container.innerHTML = "";

    for (const slide of slideData.Slides) {
        for (const element of slide.Elements) {
            var el;

            if (element.type === 'text') {
                el = document.createElement('div');
                el.style.left = `${element.Position.X}px`;
                el.style.top = `${element.Position.Y}px`;
                el.innerHTML = marked.parse(element.Content);
                el.style.color = 'black';
                el.style.cursor = 'pointer';
            } else if (element.type === 'circle') {
                el = document.createElement('div');
                el.style.left = `${element.Position.X}px`;
                el.style.top = `${element.Position.Y}px`;
                el.style.width = `${element.Size.Width}px`;
                el.style.height = `${element.Size.Height}px`;
                el.style.borderRadius = '50%';
                el.style.backgroundColor = `${element.Color}`;
                el.style.cursor = 'pointer';
                el.style.transform = `rotate(${element.Angle}deg)`;
            } else if (element.type === 'rectangle') {
                el = document.createElement('div');
                el.style.left = `${element.Position.X}px`;
                el.style.top = `${element.Position.Y}px`;
                el.style.width = `${element.Size.Width}px`;
                el.style.height = `${element.Size.Height}px`;
                el.style.backgroundColor = `${element.Color}`;
                el.style.cursor = 'pointer';
                el.style.transform = `rotate(${element.Angle}deg)`;
            } else if (element.type === 'arrow') {
                el = document.createElementNS("http://www.w3.org/2000/svg", "line");
                el.setAttribute("x1", element.Position.X);
                el.setAttribute("y1", element.Position.Y);
                el.setAttribute("x2", element.EndPosition.X);
                el.setAttribute("y2", element.EndPosition.Y);
                el.setAttribute("stroke", "black");
                el.setAttribute("stroke-width", "2");
                el.style.cursor = "pointer";
            }

            el.classList.add('slide-element');
            el.dataset.index = element.Id;
            el.style.position = 'absolute';

            container.appendChild(el);
            const divider = document.createElement('div');
            //divider.classList.add('html2pdf_page-break');
            container.appendChild(divider);
        }

    }
    container = document.getElementById('currentSlide');
    html2pdf(container);
}


async function startConnection() {
    try {
        await connection.start();
        var urlParams = new URLSearchParams(window.location.search);
        var nickname = urlParams.get('nickName');
        const presentationId = urlParams.get('idPresentation');
        await connection.invoke("JoinPresentation", presentationId, nickname);
        userRole = slideElements.Users.find(x => x.Nickname == nickname).Role;
        console.log("SignalR connection started.", connection.id);
    } catch (err) {
        console.error("Error while starting connection: ", err);
        setTimeout(startConnection, 1000);
    }
}

startConnection();
