import React from 'react';
import { Title, Text, Accordion } from '@mantine/core';
import type { Metadata } from '../types/bookTypes';
import classes from './Metadata.module.css';

interface MetadataProps {
  metadata: Metadata;
}

const MetadataComponent: React.FC<MetadataProps> = ({ metadata }) => {
  if (!metadata) return null;

  // Calculate title size based on length
  const getTitleSize = (title: string) => {
    const length = title.length;
    if (length < 30) return 'text-4xl'; // Long titles
    if (length < 50) return 'text-3xl'; // Longer titles
    if (length < 70) return 'text-2xl'; // Very long titles
    return 'text-xl'; // Extremely long titles
  };

  // Get title class based on length
  const titleSize = getTitleSize(metadata.original_title);

  return (
    <div className={classes.metadataContainer}>
      <Title 
        order={1} 
        className={`${classes.bookTitle} ${classes[titleSize]}`}
        style={{
          lineHeight: 1.2,
          marginBottom: '1rem',
          wordBreak: 'break-word',
          hyphens: 'auto'
        }}
      >
        {metadata.original_title}
      </Title>
      
      {metadata.author && (
        <Text 
          size="lg" 
          className={classes.authorLine}
        >
          by {metadata.author}
        </Text>
      )}

      <Accordion className={classes.metadataAccordion}>
        <Accordion.Item value="metadata">
          <Accordion.Control className={classes.accordionTitle}>
            Additional Information
          </Accordion.Control>
          <Accordion.Panel>
            {metadata.publisher && (
              <Text className={classes.metadataItem}>
                <b>Publisher:</b> {metadata.publisher}
              </Text>
            )}
            
            {metadata.publication_date && (
              <Text className={classes.metadataItem}>
                <b>Publication Date:</b> {metadata.publication_date}
              </Text>
            )}
            
            {metadata.source && (
              <Text className={classes.metadataItem}>
                <b>Source:</b> {metadata.source}
              </Text>
            )}
            
            {metadata.license && (
              <Text className={classes.metadataItem}>
                <b>License:</b>{' '}
                <a 
                  href={metadata.license.target} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={classes.licenseLink}
                >
                  {metadata.license.text}
                </a>
              </Text>
            )}

            {metadata.contributors && metadata.contributors.length > 0 && (
              <div className={classes.metadataItem}>
                <Text><b>Contributors:</b></Text>
                <div className={classes.contributorsList}>
                  {metadata.contributors.map((contributor, index) => (
                    <Text key={index} className={classes.contributorItem}>
                      <b>{contributor.role.charAt(0).toUpperCase() + contributor.role.slice(1)}:</b>{' '}
                      {contributor.name}
                      {contributor.when && ` (${contributor.when})`}
                    </Text>
                  ))}
                </div>
              </div>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default MetadataComponent;