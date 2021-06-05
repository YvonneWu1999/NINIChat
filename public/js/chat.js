const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const messageTemplateOther = document.querySelector('#message-template-other').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const locationMessageTemplateOther = document.querySelector('#location-message-template-other').innerHTML
const imageMessageTemplate = document.querySelector('#image-message-template').innerHTML
const imageMessageTemplateOther = document.querySelector('#image-message-template-other').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight
    // Height of messages container
    const containerHeight = $messages.scrollHeight
    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    if (containerHeight - newMessageHeight - 1 <= Math.round(scrollOffset)) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    // console.log(message)
    if (message.username.toLowerCase() === username.trim().toLowerCase()) {
        const html = Mustache.render(messageTemplate, {
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    } else {
        const html = Mustache.render(messageTemplateOther, {
            username: message.username,
            message: message.text,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)

    }
    autoscroll()
})


socket.on('locationMessage', (message) => {
    console.log(message)
    if (message.username.toLowerCase() === username.trim().toLowerCase()) {
        const html = Mustache.render(locationMessageTemplate, {
            username: message.username,
            url: message.url,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    } else {
        const html = Mustache.render(locationMessageTemplateOther, {
            username: message.username,
            url: message.url,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    }
    autoscroll()
})
//Client receive
socket.on('receiveImage', function (message) {
    console.log(message.path)
    if (message.username.toLowerCase() === username.trim().toLowerCase()) {
        const html = Mustache.render(imageMessageTemplate, {
            username: message.username,
            path: message.path,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    } else {
        const html = Mustache.render(imageMessageTemplateOther, {
            username: message.username,
            path: message.path,
            createdAt: moment(message.createdAt).format('h:mm a')
        })
        $messages.insertAdjacentHTML('beforeend', html)
    }
    autoscroll()
})


socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})



$messageFormInput.addEventListener("input", () => {
    if ($messageFormInput.value.length == 0) {
        $messageFormButton.disabled = true
    } else {
        $messageFormButton.disabled = false
    }

})
document.getElementById('file').addEventListener('change', function () {

    const reader = new FileReader();
    reader.onload = function () {
        // const base64 = this.result.replace(/.*base64,/, '');
        socket.emit('image', this.result);
    };
    reader.readAsDataURL(this.files[0]);

}, false);
$messageForm.addEventListener('submit', (e) => {
    //prevent page refresh
    e.preventDefault()
    //disable
    $messageFormButton.disabled = true
    //target represents the target we're listening on->message-form
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        //enable
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!')
        })
    })
})
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})