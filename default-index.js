exports.handler = (request, response) => {
	// response.json({
	// 	message: 'This is a sample response.'
	// })
	setTimeout(() => {
		throw new Error('some error')
	}, 500)
}