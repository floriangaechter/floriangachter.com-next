// Package generator takes care of generating the html
package generator

import (
	"fmt"
	"html/template"
	"os"
	"path/filepath"
)

type Generator struct {
	TemplateDir string
	OutputDir   string
}

func NewGenerator(templateDir, outputDir string) *Generator {
	return &Generator{
		TemplateDir: templateDir,
		OutputDir:   outputDir,
	}
}

func (g *Generator) Generate(data any, outputFile string) error {
	if err := os.MkdirAll(g.OutputDir, 0o755); err != nil {
		return err
	}

	tmpl, err := template.ParseFiles(filepath.Join(g.TemplateDir, "default.html"))
	if err != nil {
		return err
	}

	out, err := os.Create(filepath.Join(g.OutputDir, outputFile))
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := out.Close(); closeErr != nil {
			fmt.Println("Error closing file:", closeErr)
		}
	}()

	return tmpl.Execute(out, data)
}
