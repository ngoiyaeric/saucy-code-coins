interface BlogContentProps {
  content: string;
}

const BlogContent = ({ content }: BlogContentProps) => {
  // Simple markdown-like rendering with safety checks
  const renderContent = (text: string) => {
    if (!text || typeof text !== 'string') {
      return [<p key="empty" className="text-muted-foreground">No content available.</p>];
    }
    
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines at the beginning
      if (!line.trim() && elements.length === 0) {
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={currentIndex++} className="text-4xl font-bold font-playfair text-foreground mb-8 mt-12 first:mt-0">
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={currentIndex++} className="text-3xl font-semibold font-playfair text-foreground mb-6 mt-10">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={currentIndex++} className="text-2xl font-semibold font-playfair text-foreground mb-4 mt-8">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={currentIndex++} className="text-xl font-semibold text-foreground mb-3 mt-6">
            {line.substring(5)}
          </h4>
        );
      } 
      // Lists
      else if (line.match(/^\d+\.\s/)) {
        // Numbered list - collect all consecutive numbered items
        const listItems: string[] = [];
        let j = i;
        while (j < lines.length && lines[j].match(/^\d+\.\s/)) {
          listItems.push(lines[j].replace(/^\d+\.\s/, ''));
          j++;
        }
        elements.push(
          <ol key={currentIndex++} className="list-decimal list-inside mb-6 space-y-2 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-foreground leading-relaxed">{item}</li>
            ))}
          </ol>
        );
        i = j - 1; // Skip processed items
      } else if (line.startsWith('- ')) {
        // Bullet list - collect all consecutive bullet items
        const listItems: string[] = [];
        let j = i;
        while (j < lines.length && lines[j].startsWith('- ')) {
          listItems.push(lines[j].substring(2));
          j++;
        }
        elements.push(
          <ul key={currentIndex++} className="list-disc list-inside mb-6 space-y-2 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-foreground leading-relaxed">{item}</li>
            ))}
          </ul>
        );
        i = j - 1; // Skip processed items
      }
      // Regular paragraphs
      else if (line.trim()) {
        elements.push(
          <p key={currentIndex++} className="text-foreground/90 leading-relaxed mb-6 text-lg">
            {line}
          </p>
        );
      }
      // Empty lines for spacing
      else if (elements.length > 0) {
        elements.push(<div key={currentIndex++} className="h-4" />);
      }
    }

    return elements;
  };

  return (
    <div className="blog-content">
      {renderContent(content)}
    </div>
  );
};

export default BlogContent;