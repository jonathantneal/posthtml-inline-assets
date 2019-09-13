export default {
	image: {
		resolve(node) {
			return node.tag === 'img' && node.attrs && node.attrs.src;
		},
		transform(node, data) {
			node.attrs.src = `data:${data.mime};base64,${data.buffer.toString('base64')}`;
		}
	},
	script: {
		resolve(node) {
			return node.tag === 'script' && node.attrs && node.attrs.src;
		},
		transform(node, data) {
			delete node.attrs.src;

			node.content = [
				data.buffer.toString('utf8')
			];
		}
	},
	style: {
		resolve(node) {
			return node.tag === 'link' && node.attrs && node.attrs.rel === 'stylesheet' && node.attrs.href;
		},
		transform(node, data) {
			delete node.attrs.href;
			delete node.attrs.rel;

			node.tag = 'style';

			node.content = [
				data.buffer.toString('utf8')
			];
		}
	},
	favicon: {
		resolve(node) {
			return node.tag === 'link' && node.attrs && node.attrs.rel === 'icon' && node.attrs.href;
		},
		transform(node, data) {
			node.attrs.href = `data:${data.mime};base64,${data.buffer.toString('base64')}`;
		}
	}
};
