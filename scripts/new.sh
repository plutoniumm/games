echo "Enter name of game:"
read name

cp "./scripts/template.html" "g/$name.html"
cd "g"

echo "Enter description of game:"
read desc

sed -i '' "s/{{name}}/$name/g" "$name.html"
sed -i '' "s/{{desc}}/$desc/g" "$name.html"
cd ..

touch "js/$name.js"
touch "css/$name.css"

echo ""
echo "Created files for $name"
echo "Remember to add $name to index.html and add icons"