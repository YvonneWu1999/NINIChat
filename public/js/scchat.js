const socket = io()
socket.on('message', (message) => {
    console.log(message)
})
socket.on('invoice-retailer', (invoice) => {
    document.getElementById('price1').value = invoice.price
    document.getElementById('creditTerm1').value = invoice.creditTerm
    console.log(invoice)
})
socket.on('invoice-supplier', (invoice) => {
    document.getElementById('creditLine').value = invoice.creditLine
    document.getElementById('amount').value = invoice.amount
    console.log(invoice)
})

document.querySelector('#supplier-form').addEventListener('submit', (e) => {
    e.preventDefault()
    socket.emit('sendInvoiceSupplier', { price: e.target.elements.price.value, creditTerm: e.target.elements.creditTerm.value }, () => {
        console.log('invoice delivered!')
    })

})
document.querySelector('#retailer-form').addEventListener('submit', (e) => {
    e.preventDefault()
    socket.emit('sendInvoiceRetailer', { creditLine: e.target.elements.creditLine1.value, amount: e.target.elements.amount1.value }, () => {
        console.log('invoice delivered!')
    })

})
document.querySelector('#join-room').addEventListener('click', () => {
    socket.emit('join', 1, () => {
        console.log('joined room')
    });
})
document.querySelector('#leave-room').addEventListener('click', () => {
    socket.emit('leave', 1, () => {
        console.log('left room')
    });
})
