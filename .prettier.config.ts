export default {
	printWidth: 120,
	tabWidth: 2,
	semi: true,
	singleQuote: true,
	trailingComma: 'es5',
	bracketSpacing: true,
	bracketSameLine: false,
	parser: 'babel',
	arrowParens: 'avoid',
	overrides: [
	  {
		files: ['*.md', '*.mdx'],
		options: {
		  parser: 'mdx',
		},
	  },
	  {
		files: ['*.ts', '*.tsx'],
		options: {
		  parser: 'typescript',
		},
	  },
	  {
		files: '*.html',
		options: {
		  parser: 'html',
		},
	  },
	  {
		files: '*.json',
		options: {
		  parser: 'json',
		},
	  },
	  {
		files: '*.css',
		options: {
		  parser: 'css',
		},
	  },
	],
  };
  