package main

import (
	"flag"
	"fmt"
	"html/template"
	"log"
	"os"
	"path/filepath"

	"floriangaechter.com/internal/generator"
	"floriangaechter.com/internal/parser"
	"floriangaechter.com/internal/watcher"
)

func processFiles(contentDir string, gen *generator.Generator) error {
	return filepath.Walk(contentDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if filepath.Ext(path) != ".md" {
			return nil
		}

		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		// Parse frontmatter and content
		meta, content, err := parser.ParseFrontmatter(content)
		if err != nil {
			return err
		}

		// Parse markdown
		parsed := parser.ParseMarkdown(content)

		// Generate HTML
		outputFile := filepath.Base(path[:len(path)-3]) + ".html"
		return gen.Generate(map[string]any{
			"Title":       meta.Title,
			"Date":        meta.Date,
			"Tags":        meta.Tags,
			"Content":     template.HTML(parsed.HTMLOutput),
			"Description": meta.Description,
		}, outputFile)
	})
}

func main() {
	// Define flags
	contentDir := flag.String("content", "content", "Content directory path")
	templateDir := flag.String("templates", "templates", "Templates directory path")
	outputDir := flag.String("output", "dist", "Output directory path")
	watch := flag.Bool("watch", false, "Watch for file changes")
	flag.Parse()

	// Initialize generator
	gen := generator.NewGenerator(*templateDir, *outputDir)

	// Process files
	err := processFiles(*contentDir, gen)
	if err != nil {
		log.Fatal(err)
	}

	if *watch {
		fmt.Println("Watching for changes...")
		err := watcher.Watch(*contentDir, func() error {
			return processFiles(*contentDir, gen)
		})
		if err != nil {
			log.Fatal(err)
		}
	}
}
