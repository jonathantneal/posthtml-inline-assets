export default function errorHandler(resolution, message, messages) {
	if (resolution === 'throw') {
		throw new Error(message);
	} else if (resolution === 'warn') {
		messages.push(message);
	}
}
