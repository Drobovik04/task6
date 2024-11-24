using System.Text.Json.Serialization;

namespace task6.Models
{
    [JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
    [JsonDerivedType(typeof(Text), "text")]
    [JsonDerivedType(typeof(Circle), "circle")]
    public class Element
    {
        public string Id { get; set; }
        public Position Position { get; set; } = new Position();
    }
}
